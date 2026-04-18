import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api, todayStr } from '../lib/api';
import type { ExerciseLog } from '../types';

type Step = 'input' | 'confirm';

export default function LogExercise() {
  const nav = useNavigation();
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Omit<ExerciseLog, 'id' | 'logged_at'>[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [userWeight, setUserWeight] = useState(175);

  useEffect(() => {
    api.getProfile().then(p => { if (p?.weight_lbs) setUserWeight(p.weight_lbs); }).catch(() => {});
  }, []);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.parseExercise(text.trim(), userWeight);
      const date = todayStr();
      setExercises(result.map(e => ({ ...e, date })));
      setStep('confirm');
    } catch (e: any) {
      setError(e.message || 'Failed to parse workout');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.addExerciseLogs(exercises);
      nav.goBack();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
      setSaving(false);
    }
  };

  const updateExercise = (i: number, field: string, value: string | number | null) => {
    setExercises(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const removeExercise = (i: number) => {
    setExercises(prev => prev.filter((_, idx) => idx !== i));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <TouchableOpacity onPress={() => step === 'confirm' ? setStep('input') : nav.goBack()}>
            <Text style={{ color: '#6366f1', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', flex: 1 }}>Log Exercise</Text>
        </View>

        {step === 'input' ? (
          <View style={{ flex: 1, padding: 16, gap: 16 }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>
              Describe your workout naturally — exercises, sets, reps, weight, or duration.
            </Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={'e.g. bench press 4x8 at 185lbs, 20 min run, 3x10 squats 225'}
              placeholderTextColor="#475569"
              multiline
              style={{
                backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
                borderRadius: 16, padding: 16, color: 'white', fontSize: 15,
                minHeight: 140, textAlignVertical: 'top',
              }}
            />
            {error ? <Text style={{ color: '#f87171' }}>{error}</Text> : null}
            <TouchableOpacity
              onPress={handleParse}
              disabled={loading || !text.trim()}
              style={{
                backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16,
                alignItems: 'center', opacity: loading || !text.trim() ? 0.5 : 1,
              }}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Parse Workout</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Review and edit before saving.</Text>
            {exercises.map((ex, i) => (
              <View key={i} style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }} numberOfLines={1}>{ex.name}</Text>
                  <TouchableOpacity onPress={() => removeExercise(i)}>
                    <Text style={{ color: '#64748b' }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(['strength', 'cardio', 'other'] as const).map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => updateExercise(i, 'category', c)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                        backgroundColor: ex.category === c ? '#6366f1' : '#0f172a',
                      }}
                    >
                      <Text style={{ color: ex.category === c ? 'white' : '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                  {ex.category === 'strength' && (
                    <>
                      <SmallInput label="Sets" value={String(ex.sets ?? '')} onChange={v => updateExercise(i, 'sets', v ? Number(v) : null)} />
                      <SmallInput label="Reps" value={String(ex.reps ?? '')} onChange={v => updateExercise(i, 'reps', v ? Number(v) : null)} />
                      <SmallInput label="lbs" value={String(ex.weight_lbs ?? '')} onChange={v => updateExercise(i, 'weight_lbs', v ? Number(v) : null)} />
                    </>
                  )}
                  {ex.category !== 'strength' && (
                    <SmallInput label="Min" value={String(ex.duration_min ?? '')} onChange={v => updateExercise(i, 'duration_min', v ? Number(v) : null)} />
                  )}
                  <SmallInput label="Cal burned" value={String(ex.calories_burned ?? '')} onChange={v => updateExercise(i, 'calories_burned', Number(v) || 0)} />
                </View>
              </View>
            ))}
            {error ? <Text style={{ color: '#f87171' }}>{error}</Text> : null}
            {exercises.length > 0 && (
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{ backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? <ActivityIndicator color="white" /> : (
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                    Save {exercises.length} Exercise{exercises.length > 1 ? 's' : ''}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SmallInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 3 }}>
      <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        style={{
          backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
          borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
          color: 'white', fontSize: 14, width: 72, textAlign: 'center',
        }}
      />
    </View>
  );
}
