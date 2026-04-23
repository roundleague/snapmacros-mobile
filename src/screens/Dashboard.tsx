import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MacroRing from '../components/MacroRing';
import EditLogModal from '../components/EditLogModal';
import type { EditTarget, MealEditData, ExerciseEditData } from '../components/EditLogModal';
import { api, todayStr, formatDateLong } from '../lib/api';
import type { DaySummary, ExerciseLog, FoodLog, MealType } from '../types';

const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const MEAL_ICONS: Record<MealType, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function Dashboard() {
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [insight, setInsight] = useState('');
  const [mealView, setMealView] = useState<'calories' | 'protein'>('protein');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const date = todayStr();

  const load = useCallback(() => {
    api.getSummary(date).then(data => {
      setSummary(data);
      if (data.logs.length > 0 && data.profile) {
        const fingerprint = `${date}_${data.logs.length}_${Math.round(data.totals.calories)}`;
        api.getInsight({
          profile: data.profile, totals: data.totals,
          calories_burned: data.calories_burned ?? 0, meal_count: data.logs.length,
          logs: data.logs.map(l => ({ name: l.name, calories: l.calories, protein_g: l.protein_g })),
        }).then(r => setInsight(r.insight)).catch(() => {});
        void fingerprint;
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.getStreak().then(r => setStreak(r.streak)).catch(() => {}); }, []);


  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6366f1" size="large" />
      </SafeAreaView>
    );
  }

  if (!summary?.profile?.calorie_target) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>👋</Text>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>Welcome to SnapMacros</Text>
        <Text style={{ color: '#94a3b8', textAlign: 'center', lineHeight: 22 }}>
          Go to Settings to set up your calorie and macro targets.
        </Text>
      </SafeAreaView>
    );
  }

  const { profile, totals } = summary;
  const caloriesLeft = profile.calorie_target - totals.calories;
  const overBudget = caloriesLeft < 0;
  const netCalories = Math.round(totals.calories - (summary.calories_burned ?? 0));
  const mealGroups = MEAL_ORDER
    .map(type => ({ type, logs: summary.logs.filter(l => l.meal_type === type) }))
    .filter(g => g.logs.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>{formatDateLong(date)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              {profile.name ? <Text style={{ color: '#94a3b8', fontSize: 14 }}>Hey, {profile.name}!</Text> : null}
              {streak > 0 ? (
                <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                  <Text style={{ color: '#fb923c', fontSize: 12, fontWeight: '700' }}>🔥 {streak}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: overBudget ? '#f87171' : '#34d399', fontSize: 28, fontWeight: '800' }}>
              {Math.abs(Math.round(caloriesLeft))}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 11 }}>{overBudget ? 'over budget' : 'calories left'}</Text>
          </View>
        </View>

        {/* Macro card */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MacroRing value={totals.calories} max={profile.calorie_target} color="#6366f1" label="Calories" unit="cal" size={120} strokeWidth={10} />
            <View style={{ flex: 1, marginLeft: 16, gap: 10 }}>
              <MacroBar label="Protein" value={totals.protein_g} max={profile.protein_g} color="#22c55e" unit="g" />
              <MacroBar label="Carbs" value={totals.carbs_g} max={profile.carbs_g} color="#f59e0b" unit="g" />
              <MacroBar label="Fat" value={totals.fat_g} max={profile.fat_g} color="#f43f5e" unit="g" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#334155', marginTop: 12, paddingTop: 12 }}>
            {[
              { label: 'Goal', value: profile.calorie_target, dim: false },
              { label: 'Eaten', value: Math.round(totals.calories), dim: false },
              { label: 'Burned', value: Math.round(summary.calories_burned ?? 0), dim: !summary.calories_burned },
              { label: 'Net', value: netCalories, dim: !summary.calories_burned },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, alignItems: 'center', opacity: s.dim ? 0.3 : 1 }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{s.value}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Insight */}
        {insight ? (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 14, borderLeftWidth: 3, borderLeftColor: '#6366f1' }}>
            <Text style={{ color: '#818cf8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>AI Insight</Text>
            <Text style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 20 }}>{insight}</Text>
          </View>
        ) : null}

        {/* Meal toggle */}
        {mealGroups.length > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>Meals</Text>
            <View style={{ flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 10, padding: 2, gap: 2 }}>
              {(['protein', 'calories'] as const).map(v => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setMealView(v)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
                    backgroundColor: mealView === v ? '#6366f1' : 'transparent',
                  }}
                >
                  <Text style={{ color: mealView === v ? 'white' : '#94a3b8', fontSize: 12, fontWeight: '600' }}>
                    {v === 'protein' ? 'Protein' : 'Calories'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Meal cards */}
        {mealGroups.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>🍽️</Text>
            <Text style={{ color: '#64748b', fontSize: 15 }}>No meals logged yet</Text>
          </View>
        ) : (
          mealGroups.map(g => (
            <MealCard
              key={g.type}
              mealType={g.type}
              logs={g.logs}
              view={mealView}
              onDelete={async (id) => { await api.deleteLog(id); load(); }}
              onEdit={(log) => setEditTarget({ kind: 'meal', data: { id: log.id, date: log.date, name: log.name, meal_type: log.meal_type, calories: log.calories, protein_g: log.protein_g, carbs_g: log.carbs_g, fat_g: log.fat_g, fiber_g: log.fiber_g, serving_size: log.serving_size, notes: log.notes } })}
            />
          ))
        )}

        {/* Exercise */}
        {(summary.exercise_logs?.length ?? 0) > 0 && (
          <ExerciseSection
            logs={summary.exercise_logs}
            onDelete={async (id) => { await api.deleteExerciseLog(id); load(); }}
            onEdit={(log) => setEditTarget({ kind: 'exercise', data: { id: log.id, date: log.date, name: log.name, category: log.category, sets: log.sets, reps: log.reps, weight_lbs: log.weight_lbs, duration_min: log.duration_min, calories_burned: log.calories_burned } })}
          />
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {editTarget && (
        <EditLogModal
          target={editTarget}
          onSave={() => { setEditTarget(null); load(); }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

function MacroBar({ label, value, max, color, unit }: { label: string; value: number; max: number; color: string; unit: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ color: '#cbd5e1', fontSize: 12 }}>{label}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>{Math.round(value)}<Text style={{ color: '#475569' }}>/{max}{unit}</Text></Text>
      </View>
      <View style={{ height: 5, backgroundColor: '#0f172a', borderRadius: 999 }}>
        <View style={{ width: `${pct}%`, height: 5, backgroundColor: color, borderRadius: 999 }} />
      </View>
    </View>
  );
}

function MealCard({ mealType, logs, view, onDelete, onEdit }: {
  mealType: MealType; logs: FoodLog[]; view: 'calories' | 'protein';
  onDelete: (id: number) => void; onEdit: (log: FoodLog) => void;
}) {
  const total = logs.reduce((acc, l) => acc + (view === 'protein' ? l.protein_g : l.calories), 0);
  return (
    <View style={{ backgroundColor: '#1e293b', borderRadius: 20, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 16 }}>{MEAL_ICONS[mealType]}</Text>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{MEAL_LABELS[mealType]}</Text>
        </View>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>
          {Math.round(total)}{view === 'protein' ? 'g protein' : ' cal'}
        </Text>
      </View>
      {logs.map((log, i) => (
        <View key={log.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#1e293b' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }} numberOfLines={1}>{log.name}</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>
              {log.serving_size ? `${log.serving_size} · ` : ''}P {Math.round(log.protein_g)}g · C {Math.round(log.carbs_g)}g · F {Math.round(log.fat_g)}g
            </Text>
          </View>
          <Text style={{ color: '#818cf8', fontSize: 14, fontWeight: '600' }}>
            {view === 'protein' ? `${Math.round(log.protein_g)}g` : Math.round(log.calories)}
          </Text>
          <TouchableOpacity onPress={() => onEdit(log)} style={{ padding: 4 }}>
            <Text style={{ color: '#475569', fontSize: 14 }}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(log.id)} style={{ padding: 4 }}>
            <Text style={{ color: '#475569', fontSize: 14 }}>🗑</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

function ExerciseSection({ logs, onDelete, onEdit }: {
  logs: ExerciseLog[]; onDelete: (id: number) => void; onEdit: (log: ExerciseLog) => void;
}) {
  const [open, setOpen] = useState(true);
  const total = logs.reduce((sum, e) => sum + (e.calories_burned || 0), 0);

  return (
    <View style={{ backgroundColor: '#1e293b', borderRadius: 20, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18 }}>💪</Text>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Exercise</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#34d399', fontSize: 13, fontWeight: '600' }}>{Math.round(total)} cal burned</Text>
          <Text style={{ color: '#64748b' }}>{open ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>
      {open && logs.map(log => {
        const detail = log.category === 'strength'
          ? [log.sets && log.reps ? `${log.sets}×${log.reps}` : null, log.weight_lbs ? `${log.weight_lbs} lbs` : null].filter(Boolean).join(' · ')
          : log.duration_min ? `${log.duration_min} min` : null;
        return (
          <View key={log.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#0f172a', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 14 }} numberOfLines={1}>{log.name}</Text>
              {detail ? <Text style={{ color: '#64748b', fontSize: 12 }}>{detail}</Text> : null}
            </View>
            <Text style={{ color: '#34d399', fontSize: 12, fontWeight: '600' }}>{Math.round(log.calories_burned)} cal</Text>
            <TouchableOpacity onPress={() => onEdit(log)} style={{ padding: 4 }}>
              <Text style={{ color: '#475569', fontSize: 14 }}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(log.id)} style={{ padding: 4 }}>
              <Text style={{ color: '#475569', fontSize: 14 }}>🗑</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}
