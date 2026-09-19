/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://fhnztqvdglffutqzfoat.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ce4iDAD-a6N-6YezArWUKA_K2XYbzrU';

if (!metaEnv.VITE_SUPABASE_URL || !metaEnv.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set in this deployment. Using project default connection.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
