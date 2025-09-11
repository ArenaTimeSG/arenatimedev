import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';

interface PaymentCheckoutNewProps {
  appointmentId: string;
  userId: string;
  amount: number;
  modalityName: string;
  clientName: string;
  clientEmail: string;
  onPaymentSuccess: () => void;
  mercadoPagoPublicKey?: string;
}

const PaymentCheckoutNew: React.FC<PaymentCheckoutNewProps> = ({
  appointmentId,
  userId,
  amount,
  modalityName,
  clientName,
  clientEmail,
  onPaymentSuccess,
  mercadoPagoPublicKey
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para criar preferência de pagamento
  const createPaymentPreference = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 [FRONTEND] Criando preferência de pagamento...');

      // Buscar dados do pagamento do sessionStorage
      console.log('🔍 [FRONTEND] Buscando dados do sessionStorage...');
      const storedPaymentData = sessionStorage.getItem('paymentData');
      console.log('🔍 [FRONTEND] Dados encontrados no sessionStorage:', storedPaymentData);
      
      if (!storedPaymentData) {
        console.error('❌ Payment data not found in sessionStorage');
        console.error('❌ Available sessionStorage keys:', Object.keys(sessionStorage));
        throw new Error('Dados do pagamento não encontrados');
      }

      const paymentData = JSON.parse(storedPaymentData);
      console.log('💳 Payment data from storage:', paymentData);

      const requestData = {
        description: paymentData.description,
        amount: paymentData.amount,
        user_id: paymentData.user_id,
        client_name: paymentData.client_name,
        client_email: paymentData.client_email,
        appointment_data: paymentData.appointment_data
      };

      console.log('📤 [FRONTEND] Dados sendo enviados:', requestData);
      console.log('📤 [FRONTEND] appointment_data:', paymentData.appointment_data);
      console.log('📤 [FRONTEND] appointment_data type:', typeof paymentData.appointment_data);
      console.log('📤 [FRONTEND] appointment_data keys:', paymentData.appointment_data ? Object.keys(paymentData.appointment_data) : 'null');
      
      // Usar chave anon do ambiente
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('🔑 [FRONTEND] Chave anon:', anonKey ? 'Presente' : 'Ausente');

      const response = await fetch('https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/create-payment-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar preferência');
      }

      const result = await response.json();
      console.log('✅ [FRONTEND] Preferência criada:', result);
      
      setPreferenceId(result.preference_id);
      setPaymentCreated(true);
      
      toast({
        title: 'Link de pagamento criado com sucesso!',
        description: 'Clique em "Abrir Pagamento" para finalizar.',
        variant: 'default',
      });

    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao criar preferência:', error);
      toast({
        title: 'Erro ao criar pagamento',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para abrir checkout do Mercado Pago
  const openMercadoPagoCheckout = () => {
    if (!preferenceId) {
      toast({
        title: 'Erro',
        description: 'Preferência não encontrada',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('💳 [FRONTEND] Abrindo checkout do Mercado Pago...');
      console.log('🔑 [FRONTEND] Preference ID:', preferenceId);
      console.log('🔑 [FRONTEND] Chave pública:', 'TEST-12345678-1234-1234-1234-123456789012');
      console.log('🔍 [FRONTEND] window.MercadoPago:', window.MercadoPago);
      
      // Verificar se o SDK do Mercado Pago está disponível
      if (typeof window !== 'undefined' && window.MercadoPago) {
        console.log('✅ [FRONTEND] SDK do Mercado Pago disponível');
        
        try {
          // Usar chave pública do painel de administrador
          const publicKey = mercadoPagoPublicKey || import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-7b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b';
          const mp = new window.MercadoPago(publicKey);
          console.log('✅ [FRONTEND] Instância do Mercado Pago criada com chave:', publicKey);
          
          // Abrir checkout de produção usando a URL retornada pela API
          if (response.checkout_url) {
            // Abrir o checkout de produção em uma nova janela
            window.open(response.checkout_url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
          } else {
            // Fallback para URL padrão
            const initPointUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
            window.open(initPointUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
          }
          
          console.log('✅ [FRONTEND] Checkout aberto com sucesso');
          
          // Mostrar mensagem de aguardo
          toast({
            title: 'Checkout aberto!',
            description: 'Complete o pagamento no Mercado Pago. O agendamento será confirmado automaticamente.',
            variant: 'default',
          });
          
        } catch (mpError) {
          console.error('❌ [FRONTEND] Erro ao criar instância do Mercado Pago:', mpError);
          toast({
            title: 'Erro',
            description: 'Erro ao inicializar Mercado Pago',
            variant: 'destructive',
          });
        }
        
      } else {
        console.error('❌ [FRONTEND] SDK do Mercado Pago não encontrado');
        console.error('❌ [FRONTEND] window.MercadoPago:', window.MercadoPago);
        toast({
          title: 'Erro',
          description: 'SDK do Mercado Pago não carregado. Aguarde um momento e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao abrir checkout:', error);
      toast({
        title: 'Erro ao abrir pagamento',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  // Função para verificar status do agendamento (opcional)
  const checkBookingStatus = async () => {
    try {
      console.log('🔍 [FRONTEND] Verificando status do agendamento...');
      
      const response = await fetch(`https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/check-booking-status?id=${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao verificar status');
      }
      
      const status = await response.json();
      console.log('📊 [FRONTEND] Status do agendamento:', status);
      
      if (status.status === 'pago') {
        toast({
          title: 'Pagamento confirmado!',
          description: 'Seu agendamento foi confirmado com sucesso.',
          variant: 'default',
        });
        onPaymentSuccess();
      }
      
      return status;
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao verificar status:', error);
    }
  };

  if (paymentCreated) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Link de pagamento criado com sucesso!
          </h3>
          <p className="text-gray-600 text-sm">
            Clique no botão abaixo para abrir o checkout do Mercado Pago
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Resumo do Pagamento</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Modalidade: {modalityName}</div>
              <div>Cliente: {clientName}</div>
              <div>Total: {formatCurrency(amount)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={openMercadoPagoCheckout}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Abrir Pagamento
            </Button>
            
            <Button
              onClick={checkBookingStatus}
              variant="outline"
              className="w-full"
            >
              Verificar Status
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Se a janela de pagamento não abriu, clique no botão acima</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <CreditCard className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pagamento Seguro
        </h3>
        <p className="text-gray-600 text-sm">
          Processado pelo Mercado Pago
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Resumo do Pagamento</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Modalidade: {modalityName}</div>
            <div>Cliente: {clientName}</div>
            <div>Total: {formatCurrency(amount)}</div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={createPaymentPreference}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando Pagamento...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Agendar e Pagar
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center">
            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
            Dados protegidos com criptografia SSL
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
            Processado pelo Mercado Pago
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
            Agendamento confirmado automaticamente
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckoutNew;
