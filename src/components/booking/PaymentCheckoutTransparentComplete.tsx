import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PaymentCheckoutTransparentCompleteProps {
  appointmentId: string;
  userId: string;
  amount: number;
  modalityName: string;
  clientName: string;
  clientEmail: string;
  onPaymentSuccess: () => void;
}

const PaymentCheckoutTransparentComplete: React.FC<PaymentCheckoutTransparentCompleteProps> = ({
  appointmentId,
  userId,
  amount,
  modalityName,
  clientName,
  clientEmail,
  onPaymentSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
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
      console.log('💳 [FRONTEND] Criando preferência de pagamento transparente...');
      console.log('🔍 [FRONTEND] Props recebidas:', { appointmentId, userId, amount, modalityName });

      // Verificar se appointmentId está vazio e gerar um se necessário
      let finalAppointmentId = appointmentId;
      if (!appointmentId || appointmentId === '') {
        console.log('⚠️ [FRONTEND] appointmentId está vazio, gerando um único...');
        finalAppointmentId = `appointment_${Date.now()}_${userId}`;
        console.log('✅ [FRONTEND] appointmentId gerado:', finalAppointmentId);
      }

      // Buscar dados do pagamento do sessionStorage
      const storedPaymentData = sessionStorage.getItem('paymentData');
      if (!storedPaymentData) {
        throw new Error('Dados do pagamento não encontrados');
      }

      const appointmentData = JSON.parse(storedPaymentData);
      console.log('🔍 [FRONTEND] Dados do agendamento:', appointmentData);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const requestData = {
        owner_id: userId,
        booking_id: finalAppointmentId,
        price: amount,
        items: [{
          title: `Agendamento de ${modalityName}`,
          quantity: 1,
          unit_price: amount
        }],
        return_url: window.location.origin + '/payment/success',
        client_id: appointmentData.appointment_data?.client_id,
        appointment_date: appointmentData.appointment_data?.date,
        modality_id: appointmentData.appointment_data?.modality_id
      };

      console.log('📤 [FRONTEND] Dados sendo enviados:', requestData);
      console.log('📤 [FRONTEND] URL da função:', `${supabaseUrl}/functions/v1/create-payment-preference`);

      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('📤 [FRONTEND] Status da resposta:', response.status);
      console.log('📤 [FRONTEND] Headers da resposta:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [FRONTEND] Erro na resposta:', errorData);
        throw new Error(errorData.error || 'Erro ao criar preferência de pagamento');
      }

      const data = await response.json();
      console.log('✅ [FRONTEND] Preferência criada:', data);

      if (data.success && data.init_point) {
        setCheckoutUrl(data.init_point);
        setPreferenceId(data.preference_id);
        toast({
          title: "Preferência criada com sucesso!",
          description: "Clique no botão abaixo para abrir o checkout do Mercado Pago",
        });
      } else {
        throw new Error('Erro ao criar preferência de pagamento');
      }

    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao criar preferência:', error);
      toast({
        title: "Erro ao criar pagamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para abrir checkout
  const openCheckout = () => {
    if (!checkoutUrl) {
      toast({
        title: "Erro",
        description: "URL do checkout não encontrada",
        variant: "destructive"
      });
      return;
    }

    console.log('🔗 [FRONTEND] Abrindo checkout do Mercado Pago...');
    window.open(checkoutUrl, '_blank');
    
    toast({
      title: "Checkout aberto!",
      description: "Complete o pagamento no Mercado Pago. O agendamento será confirmado automaticamente.",
    });
  };

  // Função para verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!preferenceId) return;

    try {
      console.log('🔍 [FRONTEND] Verificando status do pagamento...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-payment-status-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          preference_id: preferenceId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 [FRONTEND] Status do pagamento:', result);
        
        if (result.success && result.payment_status === 'approved') {
          setPaymentStatus('approved');
          setPaymentData(result);
          toast({
            title: "Pagamento Aprovado!",
            description: "Seu agendamento foi confirmado com sucesso.",
          });
          onPaymentSuccess();
        }
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao verificar status:', error);
    }
  };

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (preferenceId && paymentStatus !== 'approved') {
      const interval = setInterval(checkPaymentStatus, 5000); // Verificar a cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [preferenceId, paymentStatus]);

  if (paymentStatus === 'approved') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">Pagamento Aprovado!</h3>
          </div>
          
          <p className="text-green-700 mb-4">
            Seu agendamento foi confirmado com sucesso.
          </p>

          {paymentData?.appointment && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Detalhes do Agendamento:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">{new Date(paymentData.appointment.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horário:</span>
                  <span className="font-medium">{paymentData.appointment.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modalidade:</span>
                  <span className="font-medium">{paymentData.appointment.modality_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-green-600">{formatCurrency(paymentData.appointment.valor_total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (checkoutUrl) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ExternalLink className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">Checkout Pronto!</h3>
          </div>
          
          <p className="text-blue-700 mb-4">
            Clique no botão abaixo para abrir o checkout do Mercado Pago
          </p>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Resumo do Pagamento:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Modalidade:</span>
                <span className="font-medium">{modalityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-green-600">{formatCurrency(amount)}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={openCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir Checkout do Mercado Pago
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            O agendamento será confirmado automaticamente após o pagamento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Checkout Transparente</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Modalidade:</span>
            <span className="font-medium">{modalityName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium">{clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-lg text-green-600">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>
      </div>

      <Button
        onClick={createPaymentPreference}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando Checkout...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Criar Checkout Transparente
          </>
        )}
      </Button>
    </div>
  );
};

export default PaymentCheckoutTransparentComplete;
