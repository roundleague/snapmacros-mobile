import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { api } from '../lib/api';
import type { ExerciseLog, MealType } from '../types';

export type MealEditData = {
  id: number; name: string; meal_type: MealType;
  calories: number; protein_g: number; carbs_g: number;
  fat_g: number; fiber_g: number; serving_size: string; notes?: string;
};

export type ExerciseEditData = {
  id: number; name: string; category: ExerciseLog['category'];
  sets?: number | null; reps?: number | null;
  weight_lbs?: number | null; duration_min?: number | null; calories_burned: number;
};

export type EditTarget =
  | { kind: 'meal'; data: MealEditData }
  | { kind: 'exercise'; data: ExerciseEditData };

interface Props {
  target: EditTarget;
  onSave: () => void;
  onClose: () => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const EX_CATEGORIES: ExerciseLog['category'][] = ['strength', 'cardio', 'other'];
const EX_LABELS: Record<ExerciseLog['category'], string> = { strength: 'Strength', cardio: 'Cardio', other: 'Other' };

export default function EditLogModal({ target, onSave, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [mealName, setMealName] = useState(target.kind === 'meal' ? target.data.name : '');
  const [mealType, setMealType] = useState<MealType>(target.kind === 'meal' ? target.data.meal_type : 'snack');
  const [calories, setCalories] = useState(target.kind === 'meal' ? String(target.data.calories) : '');
  const [protein, setProtein] = useState(target.kind === 'meal' ? String(target.data.protein_g) : '');
  const [carbs, setCarbs] = useState(target.kind === 'meal' ? String(target.data.carbs_g) : '');
  const [fat, setFat] = useState(target.kind === 'meal' ? String(target.data.fat_g) : '');
  const [fiber, setFiber] = useState(target.kind === 'meal' ? String(target.data.fiber_g) : '');
  const [serving, setServing] = useState(target.kind === 'meal' ? target.data.serving_size : '');

  const [exName, setExName] = useState(target.kind === 'exercise' ? target.data.name : '');
  const [category, setCategory] = useState<ExerciseLog['category']>(target.kind === 'exercise' ? target.data.category : 'strength');
  const [sets, setSets] = useState(target.kind === 'exercise' ? String(target.data.sets ?? '') : '');
  const [reps, setReps] = useState(target.kind === 'exercise' ? String(target.data.reps ?? '') : '');
  const [weight, setWeight] = useState(target.kind === 'exercise' ? String(target.data.weight_lbs ?? '') : '');
  const [duration, setDuration] = useState(target.kind === 'exercise' ? String(target.data.duration_min ?? '') : '');
  const [burned, setBurned] = useState(target.kind === 'exercise' ? String(target.data.calories_burned) : '');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (target.kind === 'meal') {
        await api.updateLog(target.data.id, {
          name: mealName.trim(), meal_type: mealType,
          calories: Number(calories) || 0, protein_g: Number(protein) || 0,
          carbs_g: Number(carbs) || 0, fat_g: Number(fat) || 0,
          fiber_g: Number(fiber) || 0, serving_size: serving.trim(),
        });
      } else {
        await api.updateExerciseLog(target.data.id, {
          name: exName.trim(), category,
          sets: sets ? Number(sets) : undefined, reps: reps ? Number(reps) : undefined,
          weight_lbs: weight ? Number(weight) : undefined,
          duration_min: duration ? Number(duration) : undefined,
          calories_burned: Number(burned) || 0,
        });
      }
      onSave();
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={{ backgroundColor: '#0f172a', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' }}>
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#334155', borderRadius: 999 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
              {target.kind === 'meal' ? 'Edit Meal' : 'Edit Exercise'}
            </Text>

            {target.kind === 'meal' ? (
              <>
                <Field label="Name"><RNInput value={mealName} onChangeText={setMealName} /></Field>
                <Field label="Meal Type">
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {MEAL_TYPES.map(t => (
                      <PillBtn key={t} label={MEAL_LABELS[t]} active={mealType === t} onPress={() => setMealType(t)} />
                    ))}
                  </View>
                </Field>
                <Field label="Serving Size"><RNInput value={serving} onChangeText={setServing} placeholder="e.g. 1 cup" /></Field>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}><Field label="Calories"><RNInput value={calories} onChangeText={setCalories} keyboardType="numeric" /></Field></View>
                  <View style={{ flex: 1 }}><Field label="Protein (g)"><RNInput value={protein} onChangeText={setProtein} keyboardType="numeric" /></Field></View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}><Field label="Carbs (g)"><RNInput value={carbs} onChangeText={setCarbs} keyboardType="numeric" /></Field></View>
                  <View style={{ flex: 1 }}><Field label="Fat (g)"><RNInput value={fat} onChangeText={setFat} keyboardType="numeric" /></Field></View>
                </View>
                <Field label="Fiber (g)"><RNInput value={fiber} onChangeText={setFiber} keyboardType="numeric" /></Field>
              </>
            ) : (
              <>
                <Field label="Exercise Name"><RNInput value={exName} onChangeText={setExName} /></Field>
                <Field label="Category">
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {EX_CATEGORIES.map(c => (
                      <PillBtn key={c} label={EX_LABELS[c]} active={category === c} onPress={() => setCategory(c)} />
                    ))}
                  </View>
                </Field>
                {category === 'strength' ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><Field label="Sets"><RNInput value={sets} onChangeText={setSets} keyboardType="numeric" /></Field></View>
                    <View style={{ flex: 1 }}><Field label="Reps"><RNInput value={reps} onChangeText={setReps} keyboardType="numeric" /></Field></View>
                    <View style={{ flex: 1 }}><Field label="Weight (lbs)"><RNInput value={weight} onChangeText={setWeight} keyboardType="numeric" /></Field></View>
                  </View>
                ) : (
                  <Field label="Duration (min)"><RNInput value={duration} onChangeText={setDuration} keyboardType="numeric" /></Field>
                )}
                <Field label="Calories Burned"><RNInput value={burned} onChangeText={setBurned} keyboardType="numeric" /></Field>
              </>
            )}

            {error ? <Text style={{ color: '#f87171', fontSize: 13 }}>{error}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{ flex: 1, backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
      {children}
    </View>
  );
}

function RNInput({ value, onChangeText, placeholder, keyboardType }: {
  value: string; onChangeText: (v: string) => void; placeholder?: string; keyboardType?: any;
}) {
  return (
    <TextInput
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor="#475569" keyboardType={keyboardType}
      style={{
        backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        color: 'white', fontSize: 14,
      }}
    />
  );
}

function PillBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        backgroundColor: active ? '#6366f1' : '#1e293b',
        borderWidth: 1, borderColor: active ? '#6366f1' : '#334155',
      }}
    >
      <Text style={{ color: active ? 'white' : '#94a3b8', fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
