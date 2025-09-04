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
  user_id: string;
  amount: number;
  description: string;
  client_name: string;
  client_email: string;
  appointment_id?: string;
}

export const usePayment = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createPaymentPreference = useCallback(async (data: CreatePaymentRequest) => {
    setIsLoading(true);
    
    try {
      console.log('💳 Creating payment preference:', data);

      const { data: result, error } = await supabase.functions.invoke('create-payment-preference', {
        body: data
      });

      if (error) {
        console.error('❌ Payment error:', error);
        throw new Error(error.message || 'Failed to create payment preference');
      }

      if (!result.success) {
        throw new Error(result.error || 'Payment creation failed');
      }

      console.log('✅ Payment preference created:', result);
      return result;
    } catch (error) {
      console.error('❌ Payment hook error:', error);
      toast({
        title: 'Erro no pagamento',
        description: error.message || 'Não foi possível processar o pagamento.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const checkPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('❌ Error checking payment status:', error);
        throw error;
      }

      return data as PaymentData;
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      throw error;
    }
  }, []);

  const getAppointmentPayments = useCallback(async (appointmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching payments:', error);
        throw error;
      }

      return data as PaymentData[];
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      throw error;
    }
  }, []);

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
        console.error('❌ Error updating payment status:', error);
        throw error;
      }

      return data as PaymentData;
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
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