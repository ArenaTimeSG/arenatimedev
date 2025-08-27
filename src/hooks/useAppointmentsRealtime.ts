import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAppointmentsRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  // Função otimizada para invalidar queries com debounce
  const debouncedInvalidate = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Se passou menos de 500ms desde a última atualização, aguardar
    if (timeSinceLastUpdate < 500) {
      setTimeout(() => {
        if (pendingUpdatesRef.current.size > 0) {
          console.log('🔔 Real-time: Aplicando', pendingUpdatesRef.current.size, 'atualizações pendentes');
          
          // Invalidar apenas a query principal de agendamentos
          queryClient.invalidateQueries({ 
            queryKey: ['appointments', user?.id],
            exact: true 
          });
          
          pendingUpdatesRef.current.clear();
          lastUpdateRef.current = Date.now();
        }
      }, 500 - timeSinceLastUpdate);
    } else {
      // Aplicar atualização imediatamente
      console.log('🔔 Real-time: Aplicando atualização imediata');
      
      queryClient.invalidateQueries({ 
        queryKey: ['appointments', user?.id],
        exact: true 
      });
      
      lastUpdateRef.current = now;
    }
  }, [queryClient, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 Iniciando real-time otimizado para agendamentos do usuário:', user.id);

    // Inscrever-se para mudanças na tabela appointments
    subscriptionRef.current = supabase
      .channel('appointments_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Real-time: Mudança detectada na tabela appointments:', payload.eventType);
          
          // Adicionar à lista de atualizações pendentes
          pendingUpdatesRef.current.add(payload.eventType);
          
          // Usar debounce para evitar muitas atualizações seguidas
          debouncedInvalidate();
        }
      )
      .subscribe((status) => {
        console.log('🔔 Real-time: Status da inscrição:', status);
      });

    // Cleanup: cancelar inscrição quando o componente for desmontado
    return () => {
      if (subscriptionRef.current) {
        console.log('🔔 Real-time: Cancelando inscrição');
        subscriptionRef.current.unsubscribe();
        pendingUpdatesRef.current.clear();
      }
    };
  }, [user?.id, debouncedInvalidate]);

  return {
    isConnected: subscriptionRef.current?.state === 'SUBSCRIBED'
  };
};
