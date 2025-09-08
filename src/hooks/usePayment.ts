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
  appointment_data?: {
    client_id: string;
    date: string;
    modality: string;
    valor_total: number;
    payment_policy: string;
  };
}

export const usePayment = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createPaymentPreference = useCallback(async (data: CreatePaymentRequest) => {
    setIsLoading(true);
    
    try {
      console.log('💳 Creating payment preference:', data);

      // Usar fetch direto para garantir que funciona
      const response = await fetch('https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/create-payment-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M'
        },
        body: JSON.stringify(data)
      });

      console.log('🔍 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Payment preference created:', result);

      if (!result.success) {
        throw new Error(result.error || 'Payment creation failed');
      }

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