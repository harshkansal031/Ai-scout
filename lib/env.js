import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const ENV = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '',
  supabaseProjectId: process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID ?? extra.supabaseProjectId ?? '',
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? extra.appEnv ?? 'development',
};

export const isSupabaseConfigured = Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey);
