import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Interface para agendamentos de clientes (usando a tabela appointments)
export interface ClientBooking {
  id: string;
  user_id: string; // agenda_id do admin
  client_id: string;
  date: string;
  status: 'a_cobrar' | 'pago' | 'cancelado' | 'agendado';
  modality: string;
  valor_total: number;
  created_at: string;
  booking_clients?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface CreateClientBookingData {
  user_id: string; // agenda_id do admin
  client_id: string;
  date: string;
  modality: string;
  valor_total: number;
}

export interface UpdateClientBookingData {
  status?: 'a_cobrar' | 'pago' | 'cancelado' | 'agendado';
  modality?: string;
  valor_total?: number;
}

export const useClientBookings = (adminUserId?: string) => {
  const queryClient = useQueryClient();

  const { data: agendamentos = [], isLoading, error } = useQuery({
    queryKey: ['clientBookings', adminUserId],
    queryFn: async () => {
      if (!adminUserId) return [];

      // Buscar apenas agendamentos que têm client_id (feitos por clientes)
      // Primeiro, buscar os IDs dos clientes da tabela booking_clients
      const { data: clientIds, error: clientError } = await supabase
        .from('booking_clients')
        .select('id');

      if (clientError) {
        console.error('Erro ao buscar clientes:', clientError);
        return [];
      }

      const clientIdArray = clientIds?.map(c => c.id) || [];

      // Agora buscar agendamentos que têm client_id que existe na tabela booking_clients
              const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', adminUserId)
          .not('client_id', 'is', null)
          .order('date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos de clientes:', error);
        return [];
      }
      
      // Buscar dados dos clientes para agendamentos que têm client_id
      const appointmentsWithClients = await Promise.all(
        (data || []).map(async (appointment) => {
          if (appointment.client_id) {
            try {
              const { data: clientData } = await supabase
                .from('booking_clients')
                .select('name')
                .eq('id', appointment.client_id)
                .single();
              
              if (clientData) {
                return { ...appointment, client: clientData };
              }
            } catch (clientError) {
              console.warn('⚠️ Erro ao buscar dados do cliente:', clientError);
            }
          }
          return appointment;
        })
      );
      
      console.log('✅ useClientBookings: Agendamentos de clientes encontrados:', appointmentsWithClients);
      console.log('✅ useClientBookings: Quantidade de agendamentos:', appointmentsWithClients?.length || 0);
      return appointmentsWithClients;
    },
    enabled: !!adminUserId
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: CreateClientBookingData & { autoConfirmada?: boolean }) => {
      const { autoConfirmada, ...bookingData } = data;
      
      console.log('🔍 useClientBookings: Tentando criar agendamento:', bookingData);
      console.log('🔍 useClientBookings: autoConfirmada:', autoConfirmada);
      
      const { data: newBooking, error } = await supabase
        .from('appointments')
        .insert({
          user_id: bookingData.user_id,
          client_id: bookingData.client_id,
          date: bookingData.date,
          status: autoConfirmada ? 'agendado' : 'a_cobrar', // Status baseado no auto-agendamento
          modality: bookingData.modality,
          valor_total: bookingData.valor_total,
          booking_source: 'online' // Agendamentos online sempre têm source 'online'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ useClientBookings: Erro ao criar agendamento:', error);
        throw error;
      }
      
      console.log('✅ useClientBookings: Agendamento criado com sucesso:', newBooking);
      return newBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientBookings', adminUserId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', adminUserId] });
    }
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdateClientBookingData) => {
      const { data: updatedBooking, error } = await supabase
        .from('appointments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientBookings', adminUserId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', adminUserId] });
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: cancelledBooking, error } = await supabase
        .from('appointments')
        .update({ status: 'cancelado' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return cancelledBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientBookings', adminUserId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', adminUserId] });
    }
  });

  const confirmBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: confirmedBooking, error } = await supabase
        .from('appointments')
        .update({ status: 'agendado' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return confirmedBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientBookings', adminUserId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', adminUserId] });
    }
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: completedBooking, error } = await supabase
        .from('appointments')
        .update({ status: 'pago' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return completedBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientBookings', adminUserId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', adminUserId] });
    }
  });

  return {
    agendamentos,
    isLoading,
    error,
    createBooking: createBookingMutation.mutate,
    updateBooking: updateBookingMutation.mutate,
    cancelBooking: cancelBookingMutation.mutate,
    confirmBooking: confirmBookingMutation.mutate,
    markCompleted: markCompletedMutation.mutate,
    isCreating: createBookingMutation.isPending,
    isUpdating: updateBookingMutation.isPending,
    isCancelling: cancelBookingMutation.isPending,
    isConfirming: confirmBookingMutation.isPending,
    isMarkingCompleted: markCompletedMutation.isPending,
    createError: createBookingMutation.error,
    updateError: updateBookingMutation.error,
    cancelError: cancelBookingMutation.error,
    confirmError: confirmBookingMutation.error,
    markCompletedError: markCompletedMutation.error
  };
};
