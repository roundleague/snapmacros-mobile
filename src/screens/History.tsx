import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditLogModal from '../components/EditLogModal';
import type { EditTarget, MealEditData, ExerciseEditData } from '../components/EditLogModal';
import { api, formatDate } from '../lib/api';
import type { HistoryDay, MealType } from '../types';

const MEAL_META: { type: MealType; label: string; icon: string; color: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: '🌅', color: '#fcd34d' },
  { type: 'lunch', label: 'Lunch', icon: '☀️', color: '#7dd3fc' },
  { type: 'dinner', label: 'Dinner', icon: '🌙', color: '#c4b5fd' },
  { type: 'snack', label: 'Snack', icon: '🍎', color: '#6ee7b7' },
];

export default function History() {
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'meals' | 'workouts'>('meals');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const load = useCallback(() => {
    api.getHistory().then(setDays).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const mealDays = days.filter(d => d.count > 0);
  const workoutDays = days.filter(d => d.exercise_count > 0);
  const visibleDays = tab === 'meals' ? mealDays : workoutDays;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>History</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, margin: 16, marginBottom: 8, padding: 3, gap: 3 }}>
        {(['meals', 'workouts'] as const).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: tab === t ? '#6366f1' : 'transparent' }}
          >
            <Text style={{ color: tab === t ? 'white' : '#94a3b8', fontWeight: '600', fontSize: 14, textTransform: 'capitalize' }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visibleDays}
        keyExtractor={item => item.date}
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>{tab === 'meals' ? '📅' : '💪'}</Text>
            <Text style={{ color: '#64748b' }}>No {tab} history yet</Text>
          </View>
        }
        renderItem={({ item }) =>
          tab === 'meals' ? (
            <MealDayRow
              day={item}
              onEditMeal={(data) => setEditTarget({ kind: 'meal', data })}
            />
          ) : (
            <WorkoutDayRow
              day={item}
              onEditExercise={(data) => setEditTarget({ kind: 'exercise', data })}
            />
          )
        }
      />

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

function MealDayRow({ day, onEditMeal }: {
  day: HistoryDay;
  onEditMeal: (data: MealEditData) => void;
}) {
  const [open, setOpen] = useState(false);
  const breakdownItems = MEAL_META.filter(({ type }) => (day.meal_breakdown?.[type]?.items?.length ?? 0) > 0);

  return (
    <View style={{ backgroundColor: '#1e293b', borderRadius: 20, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setOpen(o => !o)}>
          <View>
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>{formatDate(day.date)}</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>{day.count} items logged</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#818cf8', fontSize: 15, fontWeight: '700' }}>{Math.round(day.totals.calories)}</Text>
            <Text style={{ color: '#475569', fontSize: 11 }}>cal</Text>
            <Text style={{ color: '#64748b' }}>{open ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {open && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#334155', padding: 12, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {[
              { label: 'Protein', value: day.totals.protein_g, color: '#4ade80' },
              { label: 'Carbs', value: day.totals.carbs_g, color: '#fbbf24' },
              { label: 'Fat', value: day.totals.fat_g, color: '#fb7185' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: s.color, fontSize: 15, fontWeight: '700' }}>{Math.round(s.value)}g</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11 }}>{s.label}</Text>
              </View>
            ))}
          </View>
          {breakdownItems.map(({ type, label, icon, color }) => {
            const section = day.meal_breakdown[type];
            return (
              <View key={type} style={{ backgroundColor: '#0f172a', borderRadius: 14, padding: 12, gap: 8 }}>
                <Text style={{ fontWeight: '700', fontSize: 13 }}>
                  <Text style={{ color }}>{icon} {label}</Text>
                  <Text style={{ color: '#64748b' }}>  {Math.round(section.calories)} cal · {Math.round(section.protein_g)}g protein</Text>
                </Text>
                {section.items.map(item => (
                  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontSize: 13 }} numberOfLines={1}>{item.name}</Text>
                      {item.serving_size ? <Text style={{ color: '#475569', fontSize: 11 }}>{item.serving_size}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#cbd5e1', fontSize: 12 }}>{Math.round(item.calories)} cal</Text>
                      <Text style={{ color: '#4ade80', fontSize: 11 }}>{Math.round(item.protein_g)}g protein</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => onEditMeal({ id: item.id, name: item.name, meal_type: item.meal_type, calories: item.calories, protein_g: item.protein_g, carbs_g: item.carbs_g, fat_g: item.fat_g, fiber_g: item.fiber_g, serving_size: item.serving_size, notes: item.notes })}
                      style={{ padding: 4 }}
                    >
                      <Text style={{ color: '#475569' }}>✎</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function WorkoutDayRow({ day, onEditExercise }: {
  day: HistoryDay;
  onEditExercise: (data: ExerciseEditData) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ backgroundColor: '#1e293b', borderRadius: 20, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setOpen(o => !o)}>
          <View>
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>{formatDate(day.date)}</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>{day.exercise_count} workouts</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#34d399', fontSize: 15, fontWeight: '700' }}>{Math.round(day.exercise_calories_burned)}</Text>
            <Text style={{ color: '#475569', fontSize: 11 }}>cal burned</Text>
            <Text style={{ color: '#64748b' }}>{open ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {open && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#334155', padding: 12, gap: 8 }}>
          {day.exercise_logs.map(log => {
            const detail = log.category === 'strength'
              ? [log.sets && log.reps ? `${log.sets}×${log.reps}` : null, log.weight_lbs ? `${log.weight_lbs} lbs` : null].filter(Boolean).join(' · ')
              : log.duration_min ? `${log.duration_min} min` : null;
            return (
              <View key={log.id} style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{log.name}</Text>
                  <Text style={{ color: '#6366f1', fontSize: 11, textTransform: 'capitalize' }}>{log.category}</Text>
                  {detail ? <Text style={{ color: '#64748b', fontSize: 11 }}>{detail}</Text> : null}
                </View>
                <Text style={{ color: '#34d399', fontSize: 13, fontWeight: '600' }}>{Math.round(log.calories_burned)} cal</Text>
                <TouchableOpacity
                  onPress={() => onEditExercise({ id: log.id, name: log.name, category: log.category, sets: log.sets, reps: log.reps, weight_lbs: log.weight_lbs, duration_min: log.duration_min, calories_burned: log.calories_burned })}
                  style={{ padding: 4 }}
                >
                  <Text style={{ color: '#475569' }}>✎</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
