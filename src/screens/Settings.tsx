import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types';
import { loadPrefs, savePrefs } from '../lib/feedback';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
] as const;

const GOAL_OPTIONS = [
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'maintenance', label: 'Maintain' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
] as const;

export default function Settings() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [haptics, setHaptics] = useState(true);

  const [name, setName] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [activity, setActivity] = useState<Profile['activity']>('moderate');
  const [goal, setGoal] = useState<Profile['goal']>('maintenance');

  useEffect(() => {
    loadPrefs().then(p => setHaptics(p.haptics));
    api.getProfile().then(p => {
      if (p?.name) {
        setName(p.name);
        setWeightLbs(String(p.weight_lbs || ''));
        setHeightFt(String(p.height_ft || ''));
        setHeightIn(String(p.height_in || ''));
        setAge(String(p.age || ''));
        setSex(p.sex || 'male');
        setActivity(p.activity || 'moderate');
        setGoal(p.goal || 'maintenance');
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const calcTargets = () => {
    const w = Number(weightLbs) * 0.453592;
    const hCm = (Number(heightFt) * 12 + Number(heightIn)) * 2.54;
    const a = Number(age);
    const bmr = sex === 'male'
      ? 10 * w + 6.25 * hCm - 5 * a + 5
      : 10 * w + 6.25 * hCm - 5 * a - 161;
    const mults = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = bmr * mults[activity];
    const cal = goal === 'fat_loss' ? tdee - 500 : goal === 'muscle_gain' ? tdee + 300 : tdee;
    return {
      calorie_target: Math.round(cal),
      protein_g: Math.round(Number(weightLbs) * (goal === 'muscle_gain' ? 1.0 : 0.8)),
      carbs_g: Math.round((cal * 0.4) / 4),
      fat_g: Math.round((cal * 0.3) / 9),
    };
  };

  const handleSave = async () => {
    setSaving(true);
    const targets = calcTargets();
    await api.saveProfile({
      name, weight_lbs: Number(weightLbs), height_ft: Number(heightFt),
      height_in: Number(heightIn), age: Number(age), sex, activity, goal, ...targets,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 4 }}>Settings</Text>

          <Field label="Name">
            <Input value={name} onChangeText={setName} placeholder="Your name" />
          </Field>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Weight (lbs)">
                <Input value={weightLbs} onChangeText={setWeightLbs} keyboardType="numeric" placeholder="175" />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Age">
                <Input value={age} onChangeText={setAge} keyboardType="numeric" placeholder="28" />
              </Field>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Height (ft)">
                <Input value={heightFt} onChangeText={setHeightFt} keyboardType="numeric" placeholder="5" />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Height (in)">
                <Input value={heightIn} onChangeText={setHeightIn} keyboardType="numeric" placeholder="10" />
              </Field>
            </View>
          </View>

          <Field label="Sex">
            <PillRow
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
              value={sex}
              onChange={(v) => setSex(v as 'male' | 'female')}
            />
          </Field>

          <Field label="Activity Level">
            <PillRow options={ACTIVITY_OPTIONS as any} value={activity} onChange={(v) => setActivity(v as Profile['activity'])} wrap />
          </Field>

          <Field label="Goal">
            <PillRow options={GOAL_OPTIONS as any} value={goal} onChange={(v) => setGoal(v as Profile['goal'])} />
          </Field>

          {/* Preferences */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Preferences
            </Text>
            <View style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ gap: 2 }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Haptic feedback</Text>
                <Text style={{ color: '#64748b', fontSize: 12 }}>Vibrate on successful log</Text>
              </View>
              <Switch
                value={haptics}
                onValueChange={v => { setHaptics(v); savePrefs({ haptics: v }); }}
                trackColor={{ false: '#334155', true: '#6366f1' }}
                thumbColor="white"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saved ? '#16a34a' : '#6366f1',
              borderRadius: 16, paddingVertical: 16,
              alignItems: 'center', marginTop: 8,
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Goals'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={signOut}
            style={{ alignItems: 'center', paddingVertical: 16 }}
          >
            <Text style={{ color: '#64748b', fontSize: 14 }}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, keyboardType }: {
  value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#475569"
      keyboardType={keyboardType}
      style={{
        backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        color: 'white', fontSize: 15,
      }}
    />
  );
}

function PillRow({ options, value, onChange, wrap }: {
  options: { value: string; label: string }[];
  value: string; onChange: (v: string) => void; wrap?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap: 8 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
            backgroundColor: value === opt.value ? '#6366f1' : '#1e293b',
            borderWidth: 1, borderColor: value === opt.value ? '#6366f1' : '#334155',
          }}
        >
          <Text style={{ color: value === opt.value ? 'white' : '#94a3b8', fontSize: 13, fontWeight: '600' }}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
