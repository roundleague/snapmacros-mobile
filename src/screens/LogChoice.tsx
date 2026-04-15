import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { LogStackParamList } from '../navigation/LogStackNavigator';

type Nav = StackNavigationProp<LogStackParamList, 'LogChoice'>;

export default function LogChoice() {
  const nav = useNavigation<Nav>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ flex: 1, padding: 16, justifyContent: 'center', gap: 16 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 8 }}>What are you logging?</Text>

        <TouchableOpacity
          onPress={() => nav.navigate('LogMeal')}
          style={{
            backgroundColor: '#1e293b', borderRadius: 24, padding: 28,
            alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#334155',
          }}
        >
          <Text style={{ fontSize: 48 }}>📸</Text>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Food</Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>
            Snap a photo or describe your meal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => nav.navigate('LogExercise')}
          style={{
            backgroundColor: '#1e293b', borderRadius: 24, padding: 28,
            alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#334155',
          }}
        >
          <Text style={{ fontSize: 48 }}>💪</Text>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Exercise</Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>
            Describe your workout in plain text
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
