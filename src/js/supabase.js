import { createClient } from '@supabase/supabase-js';

// Credenciales por defecto (respaldo si no se configuran en Vercel)
const DEFAULT_URL = 'https://bzwsmntpvpvjtwiufvlx.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6d3NtbnRwdnB2anR3aXVmdmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDk2NjYsImV4cCI6MjA5NjgyNTY2Nn0.e4QtIcJKnvEiiifdEqgJvLNLa6g7t13Gz4JxRFBbeUo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('TU_SUPABASE_ANON_KEY'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

