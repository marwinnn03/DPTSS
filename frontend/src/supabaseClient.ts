/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fhnztqvdglffutqzfoat.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobnp0cXZkZ2xmZnV0cXpmb2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTQ2NTUsImV4cCI6MjEwMTM5MDY1NX0.W5YZ6FNdru10SH2-05mfHHKGugQD4awFCzAYcUeIDGM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
