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
type DraftExercise = Omit<ExerciseLog, 'id' | 'logged_at'>;

export default function LogExercise() {
  const nav = useNavigation();
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [userWeight, setUserWeight] = useState(175);
  const [recentExercises, setRecentExercises] = useState<DraftExercise[]>([]);
  const [chipSelections, setChipSelections] = useState<DraftExercise[]>([]);

  useEffect(() => {
    api.getProfile().then(p => { if (p?.weight_lbs) setUserWeight(p.weight_lbs); }).catch(() => {});
    api.getRecentExercises()
      .then(logs => setRecentExercises(logs.map(({ id: _id, logged_at: _la, ...rest }) => rest as DraftExercise)))
      .catch(() => {});
  }, []);

  const addChip = (ex: DraftExercise) => {
    if (chipSelections.some(c => c.name.toLowerCase() === ex.name.toLowerCase())) return;
    setChipSelections(prev => [...prev, { ...ex, date: todayStr() }]);
  };

  const removeChip = (i: number) => {
    setChipSelections(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleParse = async () => {
    const hasText = text.trim().length > 0;
    const hasChips = chipSelections.length > 0;
    if (!hasText && !hasChips) return;

    setError('');

    if (!hasText) {
      setExercises(chipSelections.map(ex => ({ ...ex, date: todayStr() })));
      setStep('confirm');
      return;
    }

    setLoading(true);
    try {
      const result = await api.parseExercise(text.trim(), userWeight);
      const date = todayStr();
      const dated = result.map(e => ({ ...e, date }));
      const chipNames = new Set(chipSelections.map(c => c.name.toLowerCase()));
      const deduped = dated.filter(e => !chipNames.has(e.name.toLowerCase()));
      setExercises([
        ...chipSelections.map(ex => ({ ...ex, date })),
        ...deduped,
      ]);
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
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
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

            {recentExercises.length > 0 && (
              <ExerciseChips
                recent={recentExercises}
                selections={chipSelections}
                onAdd={addChip}
                onRemove={removeChip}
              />
            )}

            {error ? <Text style={{ color: '#f87171' }}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleParse}
              disabled={loading || (!text.trim() && chipSelections.length === 0)}
              style={{
                backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16,
                alignItems: 'center', opacity: loading || (!text.trim() && chipSelections.length === 0) ? 0.5 : 1,
              }}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                    {text.trim() ? 'Parse Workout' : 'Log Selected'}
                  </Text>
              }
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
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

            {recentExercises.length > 0 && (
              <ExerciseChips
                recent={recentExercises}
                selections={[]}
                onAdd={ex => setExercises(prev => [...prev, { ...ex, date: todayStr() }])}
                onRemove={() => {}}
                label="+ Add from suggestions"
              />
            )}

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

function ExerciseChips({
  recent,
  selections,
  onAdd,
  onRemove,
  label = 'Quick add from history',
}: {
  recent: DraftExercise[];
  selections: DraftExercise[];
  onAdd: (ex: DraftExercise) => void;
  onRemove: (i: number) => void;
  label?: string;
}) {
  if (recent.length === 0) return null;
  const selectedNames = new Set(selections.map(s => s.name.toLowerCase()));

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {recent.map(ex => {
          const selected = selectedNames.has(ex.name.toLowerCase());
          const dotColor = ex.category === 'strength' ? '#818cf8' : ex.category === 'cardio' ? '#34d399' : '#475569';
          return (
            <TouchableOpacity
              key={ex.name}
              onPress={() => !selected && onAdd(ex)}
              disabled={selected}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                backgroundColor: selected ? 'rgba(6,78,59,0.4)' : '#1e293b',
                borderWidth: 1,
                borderColor: selected ? '#059669' : '#334155',
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />
              <Text style={{ color: selected ? '#34d399' : '#cbd5e1', fontSize: 13, fontWeight: '500' }}>
                {ex.name}{selected ? ' ✓' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selections.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {selections.map((ex, i) => (
            <View key={ex.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(6,78,59,0.3)', borderWidth: 1, borderColor: '#065f46', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ color: '#34d399', fontSize: 12 }}>{ex.name}</Text>
              <TouchableOpacity onPress={() => onRemove(i)}>
                <Text style={{ color: '#6ee7b7', fontSize: 14, lineHeight: 16 }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
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
