import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Não tentar novamente para erros de timeout, autenticação ou RLS
        if (error?.message?.includes('Timeout') ||
            error?.message?.includes('autenticado') || 
            error?.message?.includes('auth') ||
            error?.message?.includes('permission') ||
            error?.message?.includes('RLS')) {
          console.log('🚫 Não tentando novamente:', error.message);
          return false;
        }
        
        // Máximo 2 tentativas para outros erros
        if (failureCount >= 2) {
          console.log('🔄 Máximo de tentativas atingido');
          return false;
        }
        
        console.log(`🔄 Tentativa ${failureCount + 1} de 2`);
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Evitar refetch automático
      refetchOnMount: false, // Evitar refetch automático
    },
    mutations: {
      retry: false,
      retryDelay: 0,
    },
  },
});
