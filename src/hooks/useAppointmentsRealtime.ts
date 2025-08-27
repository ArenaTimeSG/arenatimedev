import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAppointmentsRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 Iniciando real-time para agendamentos do usuário:', user.id);

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
          console.log('🔔 Real-time: Mudança detectada na tabela appointments:', payload);
          
          // Invalidar a query de agendamentos para forçar atualização
          queryClient.invalidateQueries({ 
            queryKey: ['appointments', user.id],
            exact: true 
          });
          
          // Também invalidar queries relacionadas
          queryClient.invalidateQueries({ 
            queryKey: ['appointments'],
            exact: false 
          });
          
          // Invalidar queries de clientes se necessário
          queryClient.invalidateQueries({ 
            queryKey: ['clients'],
            exact: false 
          });
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
      }
    };
  }, [user?.id, queryClient]);

  return {
    isConnected: subscriptionRef.current?.state === 'SUBSCRIBED'
  };
};
