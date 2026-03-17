import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// ── Supabase credentials ──
const SUPABASE_URL = 'https://spcafwfinaekduvmxuhw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwY2Fmd2ZpbmFla2R1dm14dWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzgyNDksImV4cCI6MjA4ODI1NDI0OX0.snyITmAiejTt_xfouSiRQwrMUOqjkrL7S8GXWNSmiVw';

// ── SecureStore adapter for Supabase ──
// Persists auth tokens in the device's secure enclave instead of AsyncStorage
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // SecureStore might fail on web or if key is too long
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore errors on removal
    }
  },
};

// ── Supabase client ──
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native
  },
});
