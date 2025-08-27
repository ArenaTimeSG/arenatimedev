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
  booking_source: 'manual' | 'online';
  created_at: string;
  client?: {
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
  booking_source?: 'manual' | 'online';
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
    staleTime: 1000 * 30, // 30 segundos para agendamentos (mais responsivo)
    gcTime: 1000 * 60 * 3, // 3 minutos de cache
    queryFn: async (): Promise<AppointmentWithModality[]> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        throw error;
      }

      // Otimização: Buscar todos os clientes de uma vez
      const uniqueClientIds = [...new Set((data || []).map(apt => apt.client_id).filter(Boolean))];
      const uniqueModalityIds = [...new Set((data || []).map(apt => apt.modality_id).filter(Boolean))];
      
      // Buscar todos os clientes necessários
      let clientsMap = new Map();
      if (uniqueClientIds.length > 0) {
        try {
          const { data: clientsData } = await supabase
            .from('booking_clients')
            .select('id, name')
            .in('id', uniqueClientIds);
          
          if (clientsData) {
            clientsMap = new Map(clientsData.map(client => [client.id, client]));
          }
        } catch (clientsError) {
          console.warn('⚠️ Erro ao buscar dados dos clientes:', clientsError);
        }
      }
      
      // Buscar todas as modalidades necessárias
      let modalitiesMap = new Map();
      if (uniqueModalityIds.length > 0) {
        try {
          const { data: modalitiesData } = await supabase
            .from('modalities')
            .select('id, name, valor')
            .in('id', uniqueModalityIds);
          
          if (modalitiesData) {
            modalitiesMap = new Map(modalitiesData.map(modality => [modality.id, modality]));
          }
        } catch (modalitiesError) {
          console.warn('⚠️ Erro ao buscar dados das modalidades:', modalitiesError);
        }
      }
      
      // Combinar dados dos agendamentos com clientes e modalidades
      const appointmentsWithDetails = (data || []).map((appointment) => {
        let appointmentWithDetails = { ...appointment };
        
        // Adicionar dados do cliente
        if (appointment.client_id && clientsMap.has(appointment.client_id)) {
          const clientData = clientsMap.get(appointment.client_id);
          appointmentWithDetails.client = { name: clientData.name };
        }
        
        // Adicionar dados da modalidade
        if (appointment.modality_id && modalitiesMap.has(appointment.modality_id)) {
          const modalityData = modalitiesMap.get(appointment.modality_id);
          appointmentWithDetails.modality_info = {
            name: modalityData.name,
            valor: modalityData.valor
          };
        }
          
          return appointmentWithDetails;
        });

      return appointmentsWithDetails;
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
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) {
      console.error('❌ Erro ao buscar agendamentos por período:', error);
      throw error;
    }

    // Otimização: Buscar todos os clientes e modalidades de uma vez
    const uniqueClientIds = [...new Set((data || []).map(apt => apt.client_id).filter(Boolean))];
    const uniqueModalityIds = [...new Set((data || []).map(apt => apt.modality_id).filter(Boolean))];
    
    // Buscar todos os clientes necessários
    let clientsMap = new Map();
    if (uniqueClientIds.length > 0) {
      try {
        const { data: clientsData } = await supabase
          .from('booking_clients')
          .select('id, name')
          .in('id', uniqueClientIds);
        
        if (clientsData) {
          clientsMap = new Map(clientsData.map(client => [client.id, client]));
        }
      } catch (clientsError) {
        console.warn('⚠️ Erro ao buscar dados dos clientes:', clientsError);
      }
    }
    
    // Buscar todas as modalidades necessárias
    let modalitiesMap = new Map();
    if (uniqueModalityIds.length > 0) {
      try {
        const { data: modalitiesData } = await supabase
          .from('modalities')
          .select('id, name, valor')
          .in('id', uniqueModalityIds);
        
        if (modalitiesData) {
          modalitiesMap = new Map(modalitiesData.map(modality => [modality.id, modality]));
        }
      } catch (modalitiesError) {
        console.warn('⚠️ Erro ao buscar dados das modalidades:', modalitiesError);
      }
    }
    
    // Combinar dados dos agendamentos com clientes e modalidades
    const appointmentsWithDetails = (data || []).map((appointment) => {
      let appointmentWithDetails = { ...appointment };
      
      // Adicionar dados do cliente
      if (appointment.client_id && clientsMap.has(appointment.client_id)) {
        const clientData = clientsMap.get(appointment.client_id);
        appointmentWithDetails.client = { name: clientData.name };
      }
      
      // Adicionar dados da modalidade
      if (appointment.modality_id && modalitiesMap.has(appointment.modality_id)) {
        const modalityData = modalitiesMap.get(appointment.modality_id);
        appointmentWithDetails.modality_info = {
          name: modalityData.name,
          valor: modalityData.valor
        };
      }
        
        return appointmentWithDetails;
      });

    return appointmentsWithDetails;
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
          booking_source: appointmentData.booking_source || 'manual',
          user_id: user.id
        })
        .select('*')
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
        description: `Agendamento foi criado com sucesso.`,
      });
      
      // Otimização: Atualizar cache diretamente em vez de invalidar
      queryClient.setQueryData(['appointments', user?.id], (oldData: AppointmentWithModality[] | undefined) => {
        if (!oldData) return [newAppointment];
        return [newAppointment, ...oldData];
      });
      
      // Invalidar queries relacionadas de forma mais específica
      queryClient.invalidateQueries({ 
        queryKey: ['appointments'], 
        exact: false 
      });
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
        .select('*')
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
      
      // Otimização: Atualizar cache diretamente
      queryClient.setQueryData(['appointments', user?.id], (oldData: AppointmentWithModality[] | undefined) => {
        if (!oldData) return [updatedAppointment];
        return oldData.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt);
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: ['appointments'], 
        exact: false 
      });
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
    onSuccess: (_, variables) => {
      toast({
        title: 'Agendamento removido!',
        description: 'Agendamento foi removido com sucesso.',
      });
      
      // Otimização: Remover do cache diretamente
      queryClient.setQueryData(['appointments', user?.id], (oldData: AppointmentWithModality[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(apt => apt.id !== variables);
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: ['appointments'], 
        exact: false 
      });
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
