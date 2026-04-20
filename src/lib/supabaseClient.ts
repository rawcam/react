// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] Initializing client with URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] URL or Anon Key is missing! Check your GitHub Secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Проверка подключения при старте (для диагностики)
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase] Auth event:', event, 'User:', session?.user?.email);
});
