import * as Clipboard from 'expo-clipboard';
import type { DaySummary, HistoryDay, MealType } from '../types';
import { formatDateLong } from './api';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

export function formatDaysForClipboard(days: HistoryDay[]): string {
  return [...days]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(day => {
      const lines: string[] = [];
      lines.push(`📅 ${formatDateLong(day.date)}`);
      lines.push('');

      const hasMeals = MEAL_ORDER.some(t => (day.meal_breakdown?.[t]?.items?.length ?? 0) > 0);

      if (hasMeals) {
        lines.push('🍽 Meals');
        for (const type of MEAL_ORDER) {
          const section = day.meal_breakdown?.[type];
          if (!section?.items?.length) continue;
          for (const item of section.items) {
            const parts: string[] = [];
            parts.push(`${MEAL_LABELS[type]}: ${item.name}`);
            if (item.serving_size) parts.push(`(${item.serving_size})`);
            parts.push(`— ${Math.round(item.calories)} cal`);
            parts.push(`| ${Math.round(item.protein_g)}g protein`);
            if (item.carbs_g != null) parts.push(`| ${Math.round(item.carbs_g)}g carbs`);
            if (item.fat_g != null) parts.push(`| ${Math.round(item.fat_g)}g fat`);
            lines.push(parts.join(' '));
          }
        }
        lines.push('');
        lines.push(`Daily Totals: ${Math.round(day.totals.calories)} cal | ${Math.round(day.totals.protein_g)}g protein | ${Math.round(day.totals.carbs_g)}g carbs | ${Math.round(day.totals.fat_g)}g fat`);
      }

      if (day.exercise_logs?.length) {
        if (hasMeals) lines.push('');
        lines.push('🏋 Workouts');
        for (const ex of day.exercise_logs) {
          const parts: string[] = [ex.name];
          if (ex.category === 'strength') {
            if (ex.sets && ex.reps) parts.push(`— ${ex.sets}×${ex.reps}`);
            if (ex.weight_lbs) parts.push(`@ ${ex.weight_lbs} lbs`);
          } else if (ex.duration_min) {
            parts.push(`— ${ex.duration_min} min`);
          }
          parts.push(`(~${Math.round(ex.calories_burned)} cal burned)`);
          lines.push(parts.join(' '));
        }
        if (day.exercise_calories_burned) {
          lines.push(`Total burned: ${Math.round(day.exercise_calories_burned)} cal`);
        }
      }

      return lines.join('\n');
    })
    .join('\n\n---\n\n');
}

export function formatSummaryForClipboard(date: string, summary: DaySummary): string {
  const lines: string[] = [];
  lines.push(`📅 ${formatDateLong(date)}`);
  lines.push('');

  const hasMeals = summary.logs.length > 0;

  if (hasMeals) {
    lines.push('🍽 Meals');
    for (const type of MEAL_ORDER) {
      const items = summary.logs.filter(l => l.meal_type === type);
      for (const item of items) {
        const parts: string[] = [];
        parts.push(`${MEAL_LABELS[type]}: ${item.name}`);
        if (item.serving_size) parts.push(`(${item.serving_size})`);
        parts.push(`— ${Math.round(item.calories)} cal`);
        parts.push(`| ${Math.round(item.protein_g)}g protein`);
        parts.push(`| ${Math.round(item.carbs_g)}g carbs`);
        parts.push(`| ${Math.round(item.fat_g)}g fat`);
        lines.push(parts.join(' '));
      }
    }
    lines.push('');
    lines.push(`Daily Totals: ${Math.round(summary.totals.calories)} cal | ${Math.round(summary.totals.protein_g)}g protein | ${Math.round(summary.totals.carbs_g)}g carbs | ${Math.round(summary.totals.fat_g)}g fat`);
    if (summary.profile) {
      lines.push(`Target: ${summary.profile.calorie_target} cal | ${summary.profile.protein_g}g protein | ${summary.profile.carbs_g}g carbs | ${summary.profile.fat_g}g fat`);
    }
  }

  if (summary.exercise_logs?.length) {
    if (hasMeals) lines.push('');
    lines.push('🏋 Workouts');
    for (const ex of summary.exercise_logs) {
      const parts: string[] = [ex.name];
      if (ex.category === 'strength') {
        if (ex.sets && ex.reps) parts.push(`— ${ex.sets}×${ex.reps}`);
        if (ex.weight_lbs) parts.push(`@ ${ex.weight_lbs} lbs`);
      } else if (ex.duration_min) {
        parts.push(`— ${ex.duration_min} min`);
      }
      parts.push(`(~${Math.round(ex.calories_burned)} cal burned)`);
      lines.push(parts.join(' '));
    }
    if (summary.calories_burned) {
      lines.push(`Total burned: ${Math.round(summary.calories_burned)} cal`);
    }
  }

  return lines.join('\n');
}
