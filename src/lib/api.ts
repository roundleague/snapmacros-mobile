import type { AIAnalysis, CoachMessage, DaySummary, ExerciseLog, FoodLog, HistoryDay, MealType, Profile } from '../types';
import { supabase } from './supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getProfile: () => request<Profile>('GET', '/api/profile'),
  saveProfile: (data: Profile) => request('POST', '/api/profile', data),

  getSummary: (date: string) => request<DaySummary>('GET', `/api/summary/${date}`),
  getLogs: (date: string) => request<FoodLog[]>('GET', `/api/logs/${date}`),
  addLog: (log: Omit<FoodLog, 'id' | 'logged_at'>) => request('POST', '/api/logs', log),
  deleteLog: (id: number) => request('DELETE', `/api/logs/${id}`),
  updateLog: (id: number, data: Partial<Omit<FoodLog, 'id' | 'logged_at'>>) => request('PUT', `/api/logs/${id}`, data),

  getHistory: () => request<HistoryDay[]>('GET', '/api/history'),

  analyzeImage: (imageBase64: string, mimeType = 'image/jpeg') =>
    request<AIAnalysis>('POST', '/api/analyze', { imageBase64, mimeType }),

  parseExercise: (text: string, weight_lbs: number) =>
    request<ExerciseLog[]>('POST', '/api/exercise/parse', { text, weight_lbs }),
  getExerciseLogs: (date: string) =>
    request<ExerciseLog[]>('GET', `/api/exercise/logs/${date}`),
  addExerciseLogs: (logs: Omit<ExerciseLog, 'id' | 'logged_at'>[]) =>
    request('POST', '/api/exercise/logs', logs),
  deleteExerciseLog: (id: number) =>
    request('DELETE', `/api/exercise/logs/${id}`),
  getRecentExercises: () => request<ExerciseLog[]>('GET', '/api/exercise/logs/recent'),
  updateExerciseLog: (id: number, data: Partial<Omit<ExerciseLog, 'id' | 'logged_at'>>) =>
    request('PUT', `/api/exercise/logs/${id}`, data),
  moveDay: (fromDate: string, toDate: string) => request('PUT', `/api/day/${fromDate}/move`, { newDate: toDate }),

  parseMeals: (text: string) =>
    request<{ meals: Array<{ name: string; meal_type: MealType; serving_size: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; confidence: number }> }>('POST', '/api/meals/parse', { text }),
  getRecentMeals: () => request<FoodLog[]>('GET', '/api/logs/recent'),
  getStreak: () => request<{ streak: number }>('GET', '/api/streak'),
  getInsight: (payload: { profile: Profile; totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number }; calories_burned: number; meal_count: number; logs?: { name: string; calories: number; protein_g: number }[] }) =>
    request<{ insight: string }>('POST', '/api/insights', payload),

  getCoachMessages: () => request<CoachMessage[]>('GET', '/api/coach/messages'),
  clearCoachMessages: () => request('DELETE', '/api/coach/messages'),
};

export async function streamCoachMessage(content: string): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  return fetch(`${API_BASE}/api/coach/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const isToday = dateStr === todayStr();
  if (isToday) return 'Today';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
