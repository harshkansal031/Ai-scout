import { localBackend } from './localBackend.js';
import { supabaseBackend } from './supabaseBackend.js';

export function getBackend() {
  if (supabaseBackend.isConfigured) {
    return supabaseBackend;
  }

  return localBackend;
}
