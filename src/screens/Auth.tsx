import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: 'white', marginBottom: 4 }}>
          SnapMacros
        </Text>
        <Text style={{ color: '#94a3b8', marginBottom: 40, fontSize: 15 }}>
          AI-powered macro tracking
        </Text>

        <View style={{ gap: 12 }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#475569"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: '#334155',
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: 'white',
              fontSize: 15,
            }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#475569"
            secureTextEntry
            style={{
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: '#334155',
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: 'white',
              fontSize: 15,
            }}
          />
        </View>

        {error ? (
          <Text style={{ color: '#f87171', marginTop: 12, fontSize: 13 }}>{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: '#6366f1',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 24,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(m => m === 'signin' ? 'signup' : 'signin')} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={{ color: '#6366f1', fontWeight: '600' }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
