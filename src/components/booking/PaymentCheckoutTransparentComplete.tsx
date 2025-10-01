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
  const [popupBlocked, setPopupBlocked] = useState(false);
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

  // Função para usar preferência já criada
  const createPaymentPreference = async () => {
    if (isProcessing) {
      console.log('⚠️ [FRONTEND] Pagamento já sendo processado, ignorando duplo clique');
      return;
    }

    try {
      setIsProcessing(true);
      setIsLoading(true);
      console.log('💳 [FRONTEND] Usando preferência já criada...');

      // Buscar preference_id do sessionStorage (já criado pelo OnlineBooking)
      const preferenceId = sessionStorage.getItem('lastPaymentPreferenceId');
      console.log('🔍 [DEBUG] SessionStorage keys:', Object.keys(sessionStorage));
      console.log('🔍 [DEBUG] Preference ID no sessionStorage:', preferenceId);
      
      if (!preferenceId) {
        throw new Error('Preferência de pagamento não encontrada no sessionStorage');
      }

      console.log('💳 Preference ID encontrado:', preferenceId);

      // Buscar URL de pagamento da preferência criada
      console.log('🔍 [DEBUG] Buscando payment_record com preference_id:', preferenceId);
      
      // Primeiro tentar buscar com single()
      let { data: paymentRecord, error: paymentRecordError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('preference_id', preferenceId)
        .single();

      console.log('🔍 [DEBUG] Resultado da busca payment_record (single):', { paymentRecord, paymentRecordError });

      // Se der erro de "multiple rows", buscar todos e pegar o primeiro
      if (paymentRecordError && paymentRecordError.code === 'PGRST116') {
        console.log('⚠️ [DEBUG] Múltiplos registros encontrados, buscando todos...');
        const { data: allRecords, error: allRecordsError } = await supabase
          .from('payment_records')
          .select('*')
          .eq('preference_id', preferenceId)
          .order('created_at', { ascending: false });

        console.log('🔍 [DEBUG] Todos os registros encontrados:', allRecords);

        if (allRecordsError) {
          console.error('❌ [DEBUG] Erro ao buscar todos os registros:', allRecordsError);
          throw new Error(`Erro ao buscar registro de pagamento: ${allRecordsError.message}`);
        }

        if (allRecords && allRecords.length > 0) {
          paymentRecord = allRecords[0]; // Pegar o mais recente
          paymentRecordError = null;
          console.log('✅ [DEBUG] Usando o primeiro registro encontrado:', paymentRecord);
        } else {
          paymentRecord = null;
        }
      }

      if (paymentRecordError && paymentRecordError.code !== 'PGRST116') {
        console.error('❌ [DEBUG] Erro ao buscar payment_record:', paymentRecordError);
        throw new Error(`Erro ao buscar registro de pagamento: ${paymentRecordError.message}`);
      }

      if (!paymentRecord) {
        console.log('⚠️ [DEBUG] Registro não encontrado, tentando criar automaticamente...');
        
        // Tentar criar o registro automaticamente usando a função SQL
        try {
          // Buscar user_id do sessionStorage se paymentData for null
          const storedPaymentData = sessionStorage.getItem('paymentData');
          let userId = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'; // fallback
          
          if (storedPaymentData) {
            const parsedData = JSON.parse(storedPaymentData);
            userId = parsedData.user_id || userId;
          }
          
          console.log('🔍 [DEBUG] User ID para criação:', userId);
          
          const { data: createdRecord, error: createError } = await supabase.rpc('create_payment_record_from_preference', {
            p_preference_id: preferenceId,
            p_owner_id: userId,
            p_init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`
          });
          
          if (createError) {
            console.error('❌ [DEBUG] Erro ao criar registro automaticamente:', createError);
            throw new Error(`Erro ao criar registro de pagamento: ${createError.message}`);
          }
          
          if (createdRecord) {
            console.log('✅ [DEBUG] Registro criado automaticamente:', createdRecord);
            paymentRecord = createdRecord;
          } else {
            throw new Error(`Registro de pagamento não encontrado para preference_id: ${preferenceId}`);
          }
        } catch (createError) {
          console.error('❌ [DEBUG] Falha ao criar registro automaticamente:', createError);
          
          // Buscar todos os registros recentes para debug
          console.log('🔍 [DEBUG] Buscando todos os payment_records recentes...');
          const { data: allRecords } = await supabase
            .from('payment_records')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
          console.log('🔍 [DEBUG] Últimos 5 payment_records:', allRecords);
          
          throw new Error(`Registro de pagamento não encontrado para preference_id: ${preferenceId}`);
        }
      }

      const url = paymentRecord.init_point;
      if (!url) {
        throw new Error('URL de pagamento não encontrada');
      }

      setCheckoutUrl(url);
      setPreferenceId(preferenceId);

      console.log('🔗 Payment URL:', url);
      
      toast({
        title: "Preferência encontrada!",
        description: "Clique no botão abaixo para abrir o checkout do Mercado Pago",
      });

    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao buscar preferência:', error);
      toast({
        title: "Erro ao buscar pagamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  // Função para abrir checkout (sem redirecionamento)
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
      
      // Verificar se o popup foi bloqueado
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup bloqueado - mostrar mensagem e link manual
        console.warn('⚠️ Popup bloqueado pelo navegador');
        setPopupBlocked(true);
        setIsCheckoutOpen(false);
        toast({
          title: "Popup Bloqueado",
          description: "Permita pop-ups para este site ou use o link abaixo.",
          variant: "destructive"
        });
      } else {
        // Popup aberto com sucesso
        console.log('✅ [FRONTEND] Checkout aberto com sucesso');
        setPopupBlocked(false);
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
      setPopupBlocked(true);
      setIsCheckoutOpen(false);
      toast({
        title: "Erro ao abrir checkout",
        description: "Use o link abaixo para acessar o pagamento.",
        variant: "destructive"
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
        
        if (result.success && result.payment_status === 'approved' && result.is_confirmed) {
          setPaymentStatus('approved');
          setPaymentData(result);
          toast({
            title: "Pagamento Aprovado!",
            description: "Seu agendamento foi confirmado com sucesso.",
          });
          onPaymentSuccess(result);
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

  // Verificar status do pagamento periodicamente (continuar verificando até ser aprovado ou rejeitado)
  useEffect(() => {
    if (preferenceId && paymentStatus !== 'approved' && paymentStatus !== 'rejected') {
      console.log('🔄 [FRONTEND] Iniciando polling para preference_id:', preferenceId);
      const interval = setInterval(checkPaymentStatus, 5000); // Verificar a cada 5 segundos
      
      // Parar polling após 10 minutos
      const timeout = setTimeout(() => {
        clearInterval(interval);
        console.log('⏰ [FRONTEND] Polling finalizado por timeout');
      }, 600000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [preferenceId, paymentStatus]);

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
              setPopupBlocked(false);
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
            {popupBlocked 
              ? "Popup foi bloqueado. Use o link abaixo para acessar o pagamento:"
              : "Clique no botão abaixo para abrir o checkout do Mercado Pago"
            }
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

          {popupBlocked ? (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm mb-3">
                  <strong>Popup bloqueado:</strong> Clique no link abaixo para acessar o pagamento:
                </p>
                <a 
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
                >
                  <ExternalLink className="inline mr-2 h-4 w-4" />
                  Abrir Pagamento no Mercado Pago
                </a>
              </div>
              <Button
                onClick={() => setPopupBlocked(false)}
                variant="outline"
                className="w-full"
              >
                Tentar Abrir Popup Novamente
              </Button>
            </div>
          ) : (
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
          )}
          
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
