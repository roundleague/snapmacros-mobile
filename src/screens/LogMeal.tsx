import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { api, todayStr } from '../lib/api';
import type { FoodLog, MealType } from '../types';

type Step = 'input' | 'confirm';
type InputMode = 'camera' | 'text';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export default function LogMeal() {
  const nav = useNavigation();
  const [step, setStep] = useState<Step>('input');
  const [mode, setMode] = useState<InputMode>('camera');
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [meals, setMeals] = useState<Omit<FoodLog, 'id' | 'logged_at'>[]>([]);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission required', 'Please enable camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) return;
    setLoading(true);
    setError('');
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      const base64 = compressed.base64!;
      const analysis = await api.analyzeImage(base64);
      const date = todayStr();
      setMeals([{
        date, name: analysis.name, meal_type: 'snack',
        calories: analysis.calories, protein_g: analysis.protein_g,
        carbs_g: analysis.carbs_g, fat_g: analysis.fat_g,
        fiber_g: analysis.fiber_g, serving_size: analysis.serving_size, notes: '',
      }]);
      setStep('confirm');
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const parseText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.parseMeals(text.trim());
      const date = todayStr();
      setMeals(result.meals.map(m => ({ ...m, date, notes: '' })));
      setStep('confirm');
    } catch (e: any) {
      setError(e.message || 'Parse failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const meal of meals) {
        await api.addLog(meal);
      }
      nav.goBack();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
      setSaving(false);
    }
  };

  const updateMeal = (i: number, field: string, value: string | number | MealType) => {
    setMeals(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <TouchableOpacity onPress={() => step === 'confirm' ? setStep('input') : nav.goBack()}>
            <Text style={{ color: '#6366f1', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', flex: 1 }}>Log Meal</Text>
        </View>

        {step === 'input' ? (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Mode toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 3, gap: 3 }}>
              {(['camera', 'text'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMode(m)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                    backgroundColor: mode === m ? '#6366f1' : 'transparent',
                  }}
                >
                  <Text style={{ color: mode === m ? 'white' : '#94a3b8', fontWeight: '600', fontSize: 14 }}>
                    {m === 'camera' ? '📸 Photo' : '✏️ Text'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'camera' ? (
              <>
                {imageUri ? (
                  <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }}>
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: 240 }} resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => setImageUri(null)}
                      style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#0f172a80', borderRadius: 999, padding: 6 }}
                    >
                      <Text style={{ color: 'white' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity
                      onPress={takePhoto}
                      style={{ backgroundColor: '#1e293b', borderRadius: 16, paddingVertical: 20, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' }}
                    >
                      <Text style={{ fontSize: 36 }}>📷</Text>
                      <Text style={{ color: 'white', fontWeight: '600' }}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={pickPhoto}
                      style={{ backgroundColor: '#1e293b', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' }}
                    >
                      <Text style={{ color: '#94a3b8', fontWeight: '600' }}>Choose from Library</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {error ? <Text style={{ color: '#f87171' }}>{error}</Text> : null}
                {imageUri && (
                  <TouchableOpacity
                    onPress={analyzeImage}
                    disabled={loading}
                    style={{ backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
                  >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Analyze with AI</Text>}
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={'e.g. chicken burrito bowl from Chipotle, 2 slices pepperoni pizza'}
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
                  onPress={parseText}
                  disabled={loading || !text.trim()}
                  style={{ backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: loading || !text.trim() ? 0.5 : 1 }}
                >
                  {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Parse with AI</Text>}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Review and edit before saving.</Text>
            {meals.map((meal, i) => (
              <View key={i} style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 14, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, flex: 1 }} numberOfLines={1}>{meal.name}</Text>
                  {meals.length > 1 && (
                    <TouchableOpacity onPress={() => setMeals(p => p.filter((_, idx) => idx !== i))}>
                      <Text style={{ color: '#64748b' }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {/* Meal type pills */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {MEAL_TYPES.map(t => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => updateMeal(i, 'meal_type', t)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                        backgroundColor: meal.meal_type === t ? '#6366f1' : '#0f172a',
                        borderWidth: 1, borderColor: meal.meal_type === t ? '#6366f1' : '#334155',
                      }}
                    >
                      <Text style={{ color: meal.meal_type === t ? 'white' : '#94a3b8', fontSize: 12, fontWeight: '600' }}>
                        {MEAL_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Macro fields */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {[
                    { field: 'calories', label: 'Cal', value: meal.calories },
                    { field: 'protein_g', label: 'Protein g', value: meal.protein_g },
                    { field: 'carbs_g', label: 'Carbs g', value: meal.carbs_g },
                    { field: 'fat_g', label: 'Fat g', value: meal.fat_g },
                  ].map(f => (
                    <View key={f.field} style={{ gap: 3 }}>
                      <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>{f.label}</Text>
                      <TextInput
                        value={String(f.value)}
                        onChangeText={v => updateMeal(i, f.field, Number(v) || 0)}
                        keyboardType="numeric"
                        style={{
                          backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
                          borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                          color: 'white', fontSize: 14, width: 80, textAlign: 'center',
                        }}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {error ? <Text style={{ color: '#f87171' }}>{error}</Text> : null}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? <ActivityIndicator color="white" /> : (
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                  Save {meals.length} Meal{meals.length > 1 ? 's' : ''}
                </Text>
              )}
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
