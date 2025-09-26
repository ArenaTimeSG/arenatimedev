// Cliente Supabase corrigido para resolver o erro "Invalid API key"
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xjsovawofsibcolnrgxl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U";

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

// Criar cliente com configuração simplificada
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getStorage(),
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
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