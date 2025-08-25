import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface AppointmentWithModality {
  id: string;
  client_id: string;
  date: string;
  status: 'a_cobrar' | 'pago' | 'cancelado' | 'agendado';
  modality: string | null;
  modality_id: string | null;
  valor_total: number;
  recurrence_id: string | null;
  user_id: string;
  created_at: string;
  client: {
    name: string;
  };
  modality_info?: {
    name: string;
    valor: number;
  };
}

export interface CreateAppointmentData {
  client_id: string;
  date: string;
  modality_id: string;
  status?: 'a_cobrar' | 'pago' | 'cancelado' | 'agendado';
  recurrence_id?: string;
}

export interface UpdateAppointmentData {
  client_id?: string;
  date?: string;
  modality_id?: string;
  status?: 'a_cobrar' | 'pago' | 'cancelado' | 'agendado';
  valor_total?: number;
}

export const useAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Query para buscar agendamentos com modalidades
  const {
    data: appointments = [],
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async (): Promise<AppointmentWithModality[]> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(name),
          modality_info:modalities(name, valor)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Query para buscar agendamentos por período
  const getAppointmentsByPeriod = useCallback(async (startDate: string, endDate: string) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(name),
        modality_info:modalities(name, valor)
      `)
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) {
      console.error('❌ Erro ao buscar agendamentos por período:', error);
      throw error;
    }

    return data || [];
  }, [user?.id]);

  // Mutation para criar agendamento
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: CreateAppointmentData): Promise<AppointmentWithModality> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar o valor da modalidade
      const { data: modalityData, error: modalityError } = await supabase
        .from('modalities')
        .select('valor')
        .eq('id', appointmentData.modality_id)
        .eq('user_id', user.id)
        .single();

      if (modalityError || !modalityData) {
        throw new Error('Modalidade não encontrada');
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          client_id: appointmentData.client_id,
          date: appointmentData.date,
          modality_id: appointmentData.modality_id,
          valor_total: modalityData.valor,
          status: appointmentData.status || 'agendado',
          recurrence_id: appointmentData.recurrence_id,
          user_id: user.id
        })
        .select(`
          *,
          client:clients(name),
          modality_info:modalities(name, valor)
        `)
        .single();

      if (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (newAppointment) => {
      toast({
        title: 'Agendamento criado!',
        description: `Agendamento para ${newAppointment.client.name} foi criado com sucesso.`,
      });
      
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar agendamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar agendamento
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointmentData }): Promise<AppointmentWithModality> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const updateData: any = { ...data };

      // Se a modalidade foi alterada, buscar o novo valor
      if (data.modality_id) {
        const { data: modalityData, error: modalityError } = await supabase
          .from('modalities')
          .select('valor')
          .eq('id', data.modality_id)
          .eq('user_id', user.id)
          .single();

        if (modalityError || !modalityData) {
          throw new Error('Modalidade não encontrada');
        }

        updateData.valor_total = modalityData.valor;
      }

      const { data: updatedAppointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          client:clients(name),
          modality_info:modalities(name, valor)
        `)
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar agendamento:', error);
        throw error;
      }

      return updatedAppointment;
    },
    onSuccess: (updatedAppointment) => {
      toast({
        title: 'Agendamento atualizado!',
        description: `Agendamento foi atualizado com sucesso.`,
      });
      
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar agendamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para deletar agendamento
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erro ao deletar agendamento:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Agendamento removido!',
        description: 'Agendamento foi removido com sucesso.',
      });
      
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover agendamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Funções de conveniência
  const createAppointment = useCallback(async (data: CreateAppointmentData) => {
    setIsLoading(true);
    try {
      await createAppointmentMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  }, [createAppointmentMutation]);

  const updateAppointment = useCallback(async (id: string, data: UpdateAppointmentData) => {
    setIsLoading(true);
    try {
      await updateAppointmentMutation.mutateAsync({ id, data });
    } finally {
      setIsLoading(false);
    }
  }, [updateAppointmentMutation]);

  const deleteAppointment = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await deleteAppointmentMutation.mutateAsync(id);
    } finally {
      setIsLoading(false);
    }
  }, [deleteAppointmentMutation]);

  // Funções para cálculos financeiros
  const getFinancialSummary = useCallback((appointments: AppointmentWithModality[]) => {
    const summary = {
      total_recebido: 0,
      total_pendente: 0,
      total_agendado: 0,
      total_cancelado: 0,
      agendamentos_pagos: 0,
      agendamentos_pendentes: 0,
      agendamentos_agendados: 0,
      agendamentos_cancelados: 0,
    };

    appointments.forEach(appointment => {
      const valor = appointment.valor_total || 0;

      switch (appointment.status) {
        case 'pago':
          summary.total_recebido += valor;
          summary.agendamentos_pagos += 1;
          break;
        case 'a_cobrar':
          summary.total_pendente += valor;
          summary.agendamentos_pendentes += 1;
          break;
        case 'agendado':
          summary.total_agendado += valor;
          summary.agendamentos_agendados += 1;
          break;
        case 'cancelado':
          summary.total_cancelado += valor;
          summary.agendamentos_cancelados += 1;
          break;
      }
    });

    return summary;
  }, []);

  return {
    // Data
    appointments,
    
    // Loading states
    isLoading: isLoading || isQueryLoading,
    isCreating: createAppointmentMutation.isPending,
    isUpdating: updateAppointmentMutation.isPending,
    isDeleting: deleteAppointmentMutation.isPending,
    
    // Error states
    error: queryError,
    
    // Actions
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByPeriod,
    getFinancialSummary,
    refetch,
  };
};
