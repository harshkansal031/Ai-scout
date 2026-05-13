import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Linking } from 'react-native';
import { ENV, isSupabaseConfigured } from './env';

let supabaseClient = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: AsyncStorage,
      },
    });

    // Handle deep link when app is already open
    Linking.addEventListener('url', ({ url }) => {
      handleAuthDeepLink(url, supabaseClient);
    });

    // Handle deep link when app is launched from closed state
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthDeepLink(url, supabaseClient);
    });
  }

  return supabaseClient;
}

function handleAuthDeepLink(url, client) {
  if (!url || !url.includes('access_token')) return;

  // Extract tokens from the URL fragment (after #)
  const fragment = url.split('#')[1];
  if (!fragment) return;

  const params = Object.fromEntries(new URLSearchParams(fragment));
  const { access_token, refresh_token } = params;

  if (access_token && refresh_token) {
    client.auth.setSession({ access_token, refresh_token });
  }
}
