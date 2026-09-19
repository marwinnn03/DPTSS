/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://fhnztqvdglffutqzfoat.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobnp0cXZkZ2xmZnV0cXpmb2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTQ2NTUsImV4cCI6MjEwMTM5MDY1NX0.W5YZ6FNdru10SH2-05mfHHKGugQD4awFCzAYcUeIDGM';

const envUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL;
const envKey = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl = (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http') && envUrl !== 'undefined')
  ? envUrl.trim()
  : FALLBACK_URL;

export const supabaseAnonKey = (envKey && typeof envKey === 'string' && envKey.length > 20 && envKey !== 'undefined')
  ? envKey.trim()
  : FALLBACK_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  },
});

