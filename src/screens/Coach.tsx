import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, streamCoachMessage } from '../lib/api';
import type { CoachMessage } from '../types';

export default function Coach() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(() => {
    api.getCoachMessages().then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || streaming) return;
    setInput('');
    setStreaming(true);
    setStreamingText('');

    const userMsg: CoachMessage = { id: Date.now(), role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    scrollToBottom();

    try {
      const response = await streamCoachMessage(content);
      if (!response.body) throw new Error('No response body');

      // Stream reading
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingText(fullText);
        scrollToBottom();
      }

      const assistantMsg: CoachMessage = {
        id: Date.now() + 1, role: 'assistant',
        content: fullText, created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setStreamingText('');
    } catch (e) {
      console.error('Coach stream error:', e);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        created_at: new Date().toISOString(),
      }]);
      setStreamingText('');
    } finally {
      setStreaming(false);
      scrollToBottom();
    }
  };

  const allMessages = streamingText
    ? [...messages, { id: -1, role: 'assistant' as const, content: streamingText, created_at: '' }]
    : messages;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>Coach</Text>
          <TouchableOpacity
            onPress={() => { api.clearCoachMessages().then(loadMessages); }}
            style={{ padding: 6 }}
          >
            <Text style={{ color: '#475569', fontSize: 12 }}>Clear</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#6366f1" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={allMessages}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1, justifyContent: 'flex-end' }}
            onContentSizeChange={scrollToBottom}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🏋️</Text>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 18, marginBottom: 6 }}>Your AI Coach</Text>
                <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
                  Ask me anything about your nutrition, workouts, or progress.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={{
                alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: item.role === 'user' ? '#6366f1' : '#1e293b',
                borderRadius: 18,
                borderBottomRightRadius: item.role === 'user' ? 4 : 18,
                borderBottomLeftRadius: item.role === 'assistant' ? 4 : 18,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}>
                <Text style={{ color: 'white', fontSize: 15, lineHeight: 22 }}>
                  {item.content}
                  {item.id === -1 && <Text style={{ color: '#6366f1' }}>▋</Text>}
                </Text>
              </View>
            )}
          />
        )}

        {/* Input */}
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end', gap: 10,
          paddingHorizontal: 16, paddingVertical: 12,
          borderTopWidth: 1, borderTopColor: '#1e293b',
        }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor="#475569"
            multiline
            style={{
              flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
              borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
              color: 'white', fontSize: 15, maxHeight: 120,
            }}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={streaming || !input.trim()}
            style={{
              backgroundColor: '#6366f1', borderRadius: 999, width: 44, height: 44,
              alignItems: 'center', justifyContent: 'center',
              opacity: streaming || !input.trim() ? 0.4 : 1,
            }}
          >
            {streaming ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={{ color: 'white', fontSize: 18 }}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
