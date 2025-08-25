// Cliente Supabase corrigido para resolver o erro "Invalid API key"
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xtufbfvrgpzqbvdfmtiy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M";

// Verificar se estamos no browser
const isBrowser = typeof window !== 'undefined';

// Configuração de storage segura para browser
const getStorage = () => {
  if (!isBrowser) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  try {
    // Testar se localStorage está disponível
    const test = '__supabase_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return localStorage;
  } catch (error) {
    console.warn('localStorage não disponível, usando storage em memória');
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
};

// Criar cliente com configuração mais robusta
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getStorage(),
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react',
    },
  },
});

// Verificar se o cliente foi criado corretamente
if (isBrowser) {
  console.log('🔧 Cliente Supabase configurado para browser');
  console.log('URL:', SUPABASE_URL);
  console.log('Storage disponível:', !!getStorage());
} else {
  console.log('🔧 Cliente Supabase configurado para servidor');
}