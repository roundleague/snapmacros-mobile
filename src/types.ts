export interface Profile {
  name: string;
  weight_lbs: number;
  height_ft: number;
  height_in: number;
  age: number;
  sex: "male" | "female";
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "fat_loss" | "maintenance" | "muscle_gain";
  calorie_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodLog {
  id: number;
  date: string;
  logged_at: string;
  name: string;
  meal_type: MealType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  serving_size: string;
  notes: string;
}

export interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface ExerciseLog {
  id: number;
  date: string;
  logged_at: string;
  name: string;
  category: "strength" | "cardio" | "other";
  sets?: number;
  reps?: number;
  weight_lbs?: number;
  duration_min?: number;
  calories_burned: number;
  notes?: string;
}

export interface DaySummary {
  profile: Profile | null;
  logs: FoodLog[];
  totals: MacroTotals;
  exercise_logs: ExerciseLog[];
  calories_burned: number;
}

export interface AIAnalysis {
  name: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  confidence: number;
}

export interface CoachMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface HistoryDay {
  date: string;
  totals: Omit<MacroTotals, "fiber_g">;
  count: number;
  meal_breakdown: Record<
    MealType,
    {
      calories: number;
      protein_g: number;
      items: Array<
        Pick<FoodLog, "id" | "name" | "meal_type" | "calories" | "protein_g" | "carbs_g" | "fat_g" | "fiber_g" | "serving_size" | "notes">
      >;
    }
  >;
  exercise_count: number;
  exercise_calories_burned: number;
  exercise_logs: Array<
    Pick<
      ExerciseLog,
      | "id"
      | "name"
      | "category"
      | "sets"
      | "reps"
      | "weight_lbs"
      | "duration_min"
      | "calories_burned"
    >
  >;
}
