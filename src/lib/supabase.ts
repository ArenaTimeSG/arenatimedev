import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase - FORÇANDO URL CORRETA
const supabaseUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';

console.log('🔍 Supabase URL (FORÇADA):', supabaseUrl);
console.log('🔍 Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseKey);
