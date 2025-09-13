import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseKey);
