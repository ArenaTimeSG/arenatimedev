import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OnlineReservation {
  id: string;
  admin_user_id: string;
  modalidade_id: string;
  data: string; // ISO string
  horario: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  valor: number;
  status: string; // Permitir string genérica
  auto_confirmada: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateOnlineReservationData {
  admin_user_id: string;
  modalidade_id: string;
  modalidade_name: string; // Nome da modalidade
  data: string; // ISO string
  horario: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  valor: number;
  auto_confirmada: boolean;
}

export const useOnlineBooking = () => {
  const queryClient = useQueryClient();

  const createReservationMutation = useMutation({
    mutationFn: async (data: CreateOnlineReservationData): Promise<OnlineReservation> => {
      try {
        // 1. Primeiro, verificar se o cliente já existe ou criar um novo
        let clientId: string;
        
        // Buscar cliente existente por email ou telefone
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .or(`email.eq.${data.cliente_email},phone.eq.${data.cliente_telefone}`)
          .single();

        if (existingClient) {
          clientId = existingClient.id;
          
          // Atualizar dados do cliente se necessário
          await supabase
            .from('clients')
            .update({
              name: data.cliente_nome,
              phone: data.cliente_telefone,
              email: data.cliente_email,
            })
            .eq('id', clientId);
        } else {
          // Criar novo cliente
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              name: data.cliente_nome,
              phone: data.cliente_telefone,
              email: data.cliente_email,
              user_id: data.admin_user_id, // Vincular ao admin
            })
            .select('id')
            .single();

          if (clientError) {
            throw new Error(`Erro ao criar cliente: ${clientError.message}`);
          }

          clientId = newClient.id;
        }

        // 2. Criar o agendamento real na tabela appointments
        // Debug: Log dos dados recebidos
        console.log('🔍 Dados recebidos:', data);
        console.log('🔍 Data recebida:', data.data);
        console.log('🔍 Horário recebido:', data.horario);
        
        // Criar data correta combinando data e horário
        const [year, month, day] = data.data.split('-').map(Number);
        const [hour, minute] = data.horario.split(':').map(Number);
        
        const appointmentDate = new Date(year, month - 1, day, hour, minute, 0, 0);
        
        console.log('🔍 Data final criada:', appointmentDate);
        console.log('🔍 Data ISO:', appointmentDate.toISOString());

        // Determinar o status baseado na configuração de auto-agendamento
        // Se auto_confirmada é true, status é 'agendado', senão é 'a_cobrar' (pendente)
        const appointmentStatus = data.auto_confirmada ? 'agendado' : 'a_cobrar';

        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            client_id: clientId,
            date: appointmentDate.toISOString(),
            status: appointmentStatus,
            modality: data.modalidade_name, // Usar o nome da modalidade
            user_id: data.admin_user_id, // Vincular ao admin
            valor_total: data.valor,
          })
          .select()
          .single();

        if (appointmentError) {
          throw new Error(`Erro ao criar agendamento: ${appointmentError.message}`);
        }

        // 3. Criar registro na tabela online_reservations para histórico
        const { data: reservation, error } = await supabase
          .from('online_reservations')
          .insert({
            admin_user_id: data.admin_user_id,
            modalidade_id: data.modalidade_id,
            data: data.data,
            horario: data.horario,
            cliente_nome: data.cliente_nome,
            cliente_email: data.cliente_email,
            cliente_telefone: data.cliente_telefone,
            valor: data.valor,
            status: data.auto_confirmada ? 'confirmada' : 'pendente',
            auto_confirmada: data.auto_confirmada,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return reservation;
      } catch (error) {
        console.error('Erro ao criar reserva online:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar a lista de reservas
      queryClient.invalidateQueries({ queryKey: ['onlineReservations'] });
      queryClient.invalidateQueries({ queryKey: ['adminByUsername'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    createReservation: createReservationMutation.mutate,
    isCreating: createReservationMutation.isPending,
    error: createReservationMutation.error,
    isSuccess: createReservationMutation.isSuccess,
  };
};
