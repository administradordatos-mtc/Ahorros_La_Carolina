import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('TU_SUPABASE_ANON_KEY')) {
  console.warn('¡Supabase URL o Anon Key falta o tiene el marcador de posición en el archivo .env!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
