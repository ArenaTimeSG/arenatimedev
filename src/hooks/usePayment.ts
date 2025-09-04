import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentData {
  id: string;
  appointment_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  payment_method: string;
  mercado_pago_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  appointment_id?: string;
  user_id?: string;
  amount: number;
  description: string;
  modality_name: string;
  client_name: string;
  client_email: string;
}

export const usePayment = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Criar preferência de pagamento no Mercado Pago
  const createPaymentPreference = useCallback(async (data: CreatePaymentRequest) => {
    setIsLoading(true);
    
    try {
      console.log('💳 Criando preferência de pagamento:', data);

      const requestBody = {
        appointment_id: data.appointment_id,
        user_id: data.user_id,
        amount: data.amount,
        description: data.description,
        modality_name: data.modality_name,
        client_name: data.client_name,
        client_email: data.client_email,
      };
      
      console.log('📤 Enviando para função Edge:', requestBody);

      // Chamar função do Supabase que criará a preferência no Mercado Pago
      const { data: result, error } = await supabase.functions.invoke('create-payment-preference', {
        body: requestBody
      });

      if (error) {
        console.error('❌ Erro ao criar preferência de pagamento:', error);
        throw error;
      }

      console.log('✅ Preferência criada:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro no hook usePayment:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: 'Não foi possível criar a preferência de pagamento.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Verificar status do pagamento
  const checkPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('❌ Erro ao verificar status do pagamento:', error);
        throw error;
      }

      return data as PaymentData;
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw error;
    }
  }, []);

  // Buscar pagamentos de um agendamento
  const getAppointmentPayments = useCallback(async (appointmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar pagamentos:', error);
        throw error;
      }

      return data as PaymentData[];
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos:', error);
      throw error;
    }
  }, []);

  // Atualizar status do pagamento
  const updatePaymentStatus = useCallback(async (paymentId: string, status: PaymentData['status']) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar status do pagamento:', error);
        throw error;
      }

      return data as PaymentData;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw error;
    }
  }, []);

  return {
    isLoading,
    createPaymentPreference,
    checkPaymentStatus,
    getAppointmentPayments,
    updatePaymentStatus,
  };
};
