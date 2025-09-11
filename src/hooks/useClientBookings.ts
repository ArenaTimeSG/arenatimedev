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
  payment_status?: 'not_required' | 'pending' | 'failed';
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
  payment_policy?: 'sem_pagamento' | 'obrigatorio' | 'opcional';
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

      // Buscar agendamentos primeiro
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', adminUserId)
        .not('client_id', 'is', null)
        .order('date', { ascending: true });

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos:', appointmentsError);
        return [];
      }

      if (!appointments || appointments.length === 0) {
        return [];
      }

      // Buscar dados dos clientes separadamente
      const clientIds = appointments.map(apt => apt.client_id).filter(Boolean);
      const { data: clients, error: clientsError } = await supabase
        .from('booking_clients')
        .select('id, name, email, phone')
        .in('id', clientIds)
        .eq('user_id', adminUserId);

      if (clientsError) {
        console.error('Erro ao buscar clientes:', clientsError);
        return [];
      }

      // Combinar dados
      const data = appointments.map(appointment => ({
        ...appointment,
        booking_clients: clients?.find(client => client.id === appointment.client_id) || null
      }));

      return data || [];
    },
    enabled: !!adminUserId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 1
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: CreateClientBookingData & { autoConfirmada?: boolean }) => {
      const { autoConfirmada, ...bookingData } = data;
      
      // Verificar se o horário está bloqueado antes de criar o agendamento
      try {
        const appointmentDate = new Date(bookingData.date);
        const dateKey = appointmentDate.toISOString().split('T')[0];
        const timeSlot = appointmentDate.toTimeString().substring(0, 5);
        
        // Verificar bloqueios na tabela time_blockades
        const { data: timeBlockades, error: blockadesError } = await supabase
          .from('time_blockades')
          .select('id')
          .eq('user_id', bookingData.user_id)
          .eq('date', dateKey)
          .eq('time_slot', timeSlot);

        if (blockadesError) {
          console.error('❌ Erro ao verificar bloqueios:', blockadesError);
          throw new Error('Erro ao verificar disponibilidade do horário');
        }

        if (timeBlockades && timeBlockades.length > 0) {
          console.error('❌ Horário bloqueado:', { date: dateKey, time: timeSlot });
          throw new Error('Este horário não está disponível para agendamento');
        }

        // Verificar se já existe um agendamento neste horário
        const { data: existingAppointments, error: existingError } = await supabase
          .from('appointments')
          .select('id')
          .eq('user_id', bookingData.user_id)
          .eq('date', dateKey)
          .eq('status', 'agendado')
          .not('status', 'eq', 'cancelado');

        if (existingError) {
          console.error('❌ Erro ao verificar agendamentos existentes:', existingError);
          throw new Error('Erro ao verificar disponibilidade do horário');
        }

        if (existingAppointments && existingAppointments.length > 0) {
          console.error('❌ Horário já ocupado:', { date: dateKey, time: timeSlot });
          throw new Error('Este horário já está ocupado');
        }

      } catch (error) {
        console.error('❌ Validação de horário falhou:', error);
        throw error;
      }
      
      // Determinar payment_status e status baseado na política de pagamento
      let paymentStatus: 'not_required' | 'pending' | 'failed' = 'not_required';
      let appointmentStatus: 'a_cobrar' | 'agendado' = 'a_cobrar';
      
      if (bookingData.payment_policy === 'obrigatorio') {
        paymentStatus = 'pending';
        // Para pagamento obrigatório, SEMPRE criar como 'a_cobrar' (pendente)
        // O status só muda para 'agendado' quando o pagamento for aprovado via webhook
        appointmentStatus = 'a_cobrar';
      } else if (bookingData.payment_policy === 'opcional') {
        paymentStatus = 'not_required'; // Cliente pode escolher pagar depois
        // Para pagamento opcional, usar auto_confirmada para determinar o status
        appointmentStatus = autoConfirmada ? 'agendado' : 'a_cobrar';
      } else {
        // Para 'sem_pagamento', usar auto_confirmada para determinar o status
        appointmentStatus = autoConfirmada ? 'agendado' : 'a_cobrar';
      }

      const { data: newBooking, error } = await supabase
        .from('appointments')
        .insert({
          user_id: bookingData.user_id,
          client_id: bookingData.client_id,
          date: bookingData.date,
          status: appointmentStatus,
          modality: bookingData.modality,
          valor_total: bookingData.valor_total,
          payment_status: paymentStatus,
          booking_source: 'online' // Agendamentos online sempre têm source 'online'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ useClientBookings: Erro ao criar agendamento:', error);
        throw error;
      }
      

      return newBooking;
    },
    onSuccess: (newBooking) => {
      // Otimização: Atualizar cache diretamente para agendamentos online
      queryClient.setQueryData(['clientBookings', adminUserId], (oldData: any[] | undefined) => {
        if (!oldData) return [newBooking];
        return [newBooking, ...oldData];
      });
      
      // Atualizar cache principal de agendamentos
      queryClient.setQueryData(['appointments', adminUserId], (oldData: any[] | undefined) => {
        if (!oldData) return [newBooking];
        return [newBooking, ...oldData];
      });
      
      // Invalidar queries relacionadas de forma mais específica
      queryClient.invalidateQueries({ 
        queryKey: ['appointments'], 
        exact: false 
      });
      
      // Invalidar queries de horários disponíveis
      queryClient.invalidateQueries({ 
        queryKey: ['availableHours'], 
        exact: false 
      });
      
      // Invalidar queries de configurações de horários
      queryClient.invalidateQueries({ 
        queryKey: ['workingHours'], 
        exact: false 
      });
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
    agendamentos: agendamentos || [],
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
