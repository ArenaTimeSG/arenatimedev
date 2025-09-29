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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função auxiliar para criar pagamento com dados alternativos
  const createPaymentWithAlternativeData = async (appointmentData: any) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const requestData = {
        owner_id: userId,
        booking_id: appointmentId || `apt_${Date.now()}_${userId.substring(0, 8)}`,
        price: amount,
        items: [{
          title: `Agendamento de ${modalityName}`,
          quantity: 1,
          unit_price: amount
        }],
        return_url: window.location.origin + '/payment/success',
        client_id: appointmentData.client_id || appointmentData.clientId,
        appointment_date: appointmentData.date || appointmentData.appointment_date,
        modality_id: appointmentData.modality_id || appointmentData.modalityId
      };

      console.log('📤 [FRONTEND] Dados alternativos sendo enviados:', requestData);

      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [FRONTEND] Erro na resposta:', errorData);
        throw new Error(errorData.error || 'Erro ao criar preferência de pagamento');
      }

      const data = await response.json();
      console.log('✅ [FRONTEND] Preferência criada com dados alternativos:', data);

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
      console.error('❌ [FRONTEND] Erro ao criar preferência com dados alternativos:', error);
      throw error;
    }
  };

  // Função para criar preferência de pagamento
  const createPaymentPreference = async () => {
    if (isProcessing) {
      console.log('⚠️ [FRONTEND] Pagamento já sendo processado, ignorando duplo clique');
      return;
    }

    try {
      setIsProcessing(true);
      setIsLoading(true);
      console.log('💳 [FRONTEND] Criando preferência de pagamento transparente...');
      console.log('🔍 [FRONTEND] Props recebidas:', { appointmentId, userId, amount, modalityName });

      // Verificar se appointmentId está vazio e gerar um se necessário
      let finalAppointmentId = appointmentId;
      if (!appointmentId || appointmentId === '') {
        // Gerar ID único para o agendamento (máximo 64 caracteres para Mercado Pago)
        const timestamp = Date.now().toString();
        const userIdShort = userId.replace(/-/g, '').substring(0, 8);
        finalAppointmentId = `apt_${timestamp}_${userIdShort}`;
      }

      // Buscar dados do pagamento do sessionStorage
      const storedPaymentData = sessionStorage.getItem('paymentData');
      if (!storedPaymentData) {
        console.error('❌ Payment data not found in sessionStorage');
        console.error('❌ Available sessionStorage keys:', Object.keys(sessionStorage));
        
        // Tentar buscar dados alternativos
        const alternativeData = sessionStorage.getItem('bookingData') || sessionStorage.getItem('appointmentData');
        if (!alternativeData) {
          throw new Error('Dados do pagamento não encontrados. Por favor, refaça o agendamento.');
        }
        
        console.log('✅ Found alternative data:', alternativeData);
        const appointmentData = JSON.parse(alternativeData);
        return createPaymentWithAlternativeData(appointmentData);
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
      setIsProcessing(false);
    }
  };

  // Função para abrir checkout (com proteção contra duplo clique)
  const openCheckout = () => {
    if (isCheckoutOpen) {
      console.log('⚠️ [FRONTEND] Checkout já está aberto, ignorando duplo clique');
      return;
    }

    if (!checkoutUrl) {
      toast({
        title: "Erro",
        description: "URL do checkout não encontrada",
        variant: "destructive"
      });
      return;
    }

    console.log('🔗 [FRONTEND] Abrindo checkout do Mercado Pago...');
    setIsCheckoutOpen(true);
    
    try {
      // Tentar abrir em nova aba com nome específico para evitar duplicação
      const newWindow = window.open(checkoutUrl, 'MercadoPagoCheckout', 'width=800,height=600,scrollbars=yes,resizable=yes,noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup bloqueado, redirecionar na mesma aba
        console.warn('⚠️ Popup bloqueado, redirecionando na mesma aba');
        window.location.href = checkoutUrl;
        toast({
          title: "Redirecionando...",
          description: "Você será redirecionado para o Mercado Pago.",
        });
      } else {
        // Popup aberto com sucesso
        console.log('✅ [FRONTEND] Checkout aberto com sucesso');
        toast({
          title: "Checkout aberto!",
          description: "Complete o pagamento no Mercado Pago. O agendamento será confirmado automaticamente.",
        });
        
        // Iniciar verificação de status após 10 segundos
        setTimeout(() => {
          if (preferenceId) {
            checkPaymentStatus();
          }
        }, 10000);
      }
    } catch (error) {
      console.error('❌ Erro ao abrir checkout:', error);
      // Fallback: redirecionar na mesma aba
      window.location.href = checkoutUrl;
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para o Mercado Pago.",
      });
    }
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
        } else if (result.success && result.payment_status === 'rejected') {
          setPaymentStatus('rejected');
          toast({
            title: "Pagamento Rejeitado",
            description: "O pagamento foi rejeitado. Tente novamente.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao verificar status:', error);
    }
  };

  // Verificar status do pagamento periodicamente (apenas se checkout estiver aberto)
  useEffect(() => {
    if (preferenceId && paymentStatus !== 'approved' && isCheckoutOpen) {
      const interval = setInterval(checkPaymentStatus, 10000); // Verificar a cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [preferenceId, paymentStatus, isCheckoutOpen]);

  // Reset do estado quando componente é desmontado
  useEffect(() => {
    return () => {
      setIsCheckoutOpen(false);
      setIsProcessing(false);
    };
  }, []);

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

  if (paymentStatus === 'rejected') {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Pagamento Rejeitado</h3>
          </div>
          
          <p className="text-red-700 mb-4">
            O pagamento foi rejeitado. Tente novamente ou escolha outro método de pagamento.
          </p>

          <Button
            onClick={() => {
              setPaymentStatus(null);
              setCheckoutUrl(null);
              setPreferenceId(null);
              setIsCheckoutOpen(false);
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Tentar Novamente
          </Button>
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
            disabled={isCheckoutOpen}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            <ExternalLink className="mr-3 h-5 w-5" />
            <span className="text-lg">
              {isCheckoutOpen ? 'Checkout Aberto' : 'Abrir Checkout do Mercado Pago'}
            </span>
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            O agendamento será confirmado automaticamente após o pagamento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ícone e título */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Pagamento Seguro</h3>
        <p className="text-gray-600">Processado pelo Mercado Pago</p>
      </div>

      {/* Resumo do Pagamento */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Resumo do Pagamento
        </h4>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-blue-100">
            <span className="text-gray-600 font-medium">Modalidade:</span>
            <span className="font-semibold text-gray-800">{modalityName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-blue-100">
            <span className="text-gray-600 font-medium">Cliente:</span>
            <span className="font-semibold text-gray-800">{clientName}</span>
          </div>
          <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4">
            <span className="text-gray-600 font-medium">Total:</span>
            <span className="font-bold text-2xl text-green-600">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Métodos de Pagamento */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Métodos Aceitos
        </h4>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Cartão</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            <div className="w-4 h-4 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>
            <span className="text-sm font-medium text-gray-700">PIX</span>
          </div>
        </div>
      </div>

      {/* Botão Principal */}
      <Button
        onClick={createPaymentPreference}
        disabled={isLoading || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            <span className="text-lg">Criando Checkout...</span>
          </>
        ) : (
          <>
            <CreditCard className="mr-3 h-5 w-5" />
            <span className="text-lg">Pagar com Mercado Pago</span>
          </>
        )}
      </Button>

      {/* Informações de Segurança */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-green-800 mb-1">Pagamento Seguro</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Dados protegidos com criptografia SSL</li>
              <li>• Processado pelo Mercado Pago</li>
              <li>• Agendamento confirmado automaticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckoutTransparentComplete;