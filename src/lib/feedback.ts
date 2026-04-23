import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';

const PREFS_KEY = '@sm_prefs';

interface Prefs {
  haptics: boolean;
}

let cached: Prefs = { haptics: true };

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) cached = { ...cached, ...JSON.parse(raw) };
  } catch {}
  return cached;
}

export async function savePrefs(update: Partial<Prefs>): Promise<void> {
  cached = { ...cached, ...update };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(cached));
}

export function getCachedPrefs(): Prefs {
  return cached;
}

export function triggerHaptic(): void {
  if (!cached.haptics) return;
  Vibration.vibrate(25);
}
