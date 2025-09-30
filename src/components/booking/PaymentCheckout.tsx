import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface PaymentCheckoutProps {
  appointmentId?: string;
  userId: string;
  amount: number;
  modalityName: string;
  clientName: string;
  clientEmail: string;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

const PaymentCheckout = ({
  appointmentId,
  userId,
  amount,
  modalityName,
  clientName,
  clientEmail,
  onPaymentSuccess,
  onPaymentCancel
}: PaymentCheckoutProps) => {
  const { createPaymentPreference, isLoading } = usePayment();
  const { toast } = useToast();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);

  // Cleanup do Realtime e polling quando componente for desmontado
  useEffect(() => {
    return () => {
      if ((window as any).realtimeCleanup) {
        (window as any).realtimeCleanup();
        delete (window as any).realtimeCleanup;
      }
      if ((window as any).pollInterval) {
        clearInterval((window as any).pollInterval);
        delete (window as any).pollInterval;
      }
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para verificar pagamento diretamente no Mercado Pago
  const checkPaymentStatusDirectly = async () => {
    try {
      console.log('🔍 Verificando status do pagamento diretamente no Mercado Pago...');
      
      // Buscar dados do pagamento do sessionStorage
      const storedPaymentData = sessionStorage.getItem('paymentData');
      if (!storedPaymentData) {
        console.log('⚠️ Dados do pagamento não encontrados no sessionStorage');
        return false;
      }

      const paymentData = JSON.parse(storedPaymentData);
      console.log('🔍 Dados do pagamento para verificação:', paymentData);

      // Chamar função Edge para verificar status do pagamento
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/check-payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: paymentData.user_id,
          amount: paymentData.amount,
          description: paymentData.description
        })
      });

      if (!response.ok) {
        console.error('❌ Erro ao verificar status do pagamento:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('🔍 Resultado da verificação:', result);

      if (result.payment_approved) {
        console.log('✅ Pagamento aprovado encontrado!');
        toast({
          title: 'Pagamento Aprovado!',
          description: 'Seu agendamento foi confirmado com sucesso.',
          variant: 'default',
        });
        onPaymentSuccess();
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar status do pagamento:', error);
      return false;
    }
  };

  // Função para verificar agendamentos criados recentemente
  const checkForNewAppointments = async () => {
    try {
      console.log('🔍 Verificando agendamentos recentes...');
      
      // Buscar agendamentos dos últimos 10 minutos com status agendado E payment_status approved
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .eq('payment_status', 'approved')
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        return false;
      }

      if (appointments && appointments.length > 0) {
        console.log('✅ Agendamento confirmado encontrado!', appointments[0]);
        toast({
          title: 'Pagamento Aprovado!',
          description: 'Seu agendamento foi confirmado com sucesso.',
          variant: 'default',
        });
        onPaymentSuccess();
        return true; // Indica que encontrou um agendamento
      }

      return false; // Não encontrou agendamento
    } catch (error) {
      console.error('❌ Erro ao verificar agendamentos:', error);
      return false;
    }
  };

  // Função para escutar mudanças na tabela agendamentos via Realtime (com fallback)
  const setupRealtimeListener = () => {
    console.log('🔍 Configurando listener do Realtime para agendamentos...');
    
    // Tentar configurar Realtime
    const channel = supabase
      .channel('realtime:appointments')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'appointments' 
        },
        (payload) => {
          console.log('🔔 Novo agendamento inserido via Realtime:', payload.new);
          
          // Verificar se é um agendamento recente (últimos 5 minutos)
          const createdAt = new Date(payload.new.created_at);
          const now = new Date();
          const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
          
          if (diffMinutes <= 10 && payload.new.status === 'confirmed' && payload.new.payment_status === 'approved') {
            console.log('✅ Agendamento confirmado via Realtime!', payload.new);
            toast({
              title: 'Pagamento Aprovado!',
              description: 'Seu agendamento foi confirmado com sucesso.',
              variant: 'default',
            });
            onPaymentSuccess();
          }
        }
      )
      .subscribe((status) => {
        console.log('🔍 Status da conexão Realtime:', status);
        
        // Se Realtime falhar, usar polling como fallback
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('⚠️ Realtime falhou, iniciando polling como fallback...');
          startPolling();
        }
      });

    // Retornar função de cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Função de polling como fallback
  const startPolling = () => {
    console.log('🔄 Iniciando polling para verificar pagamento...');
    
    const pollInterval = setInterval(async () => {
      // Tentar verificar agendamentos primeiro
      let found = await checkForNewAppointments();
      
      // Se não encontrou, tentar verificação direta do Mercado Pago
      if (!found) {
        console.log('🔄 Tentando verificação direta do Mercado Pago...');
        found = await checkPaymentStatusDirectly();
      }
      
      if (found) {
        clearInterval(pollInterval);
        console.log('✅ Polling finalizado - pagamento confirmado');
      }
    }, 2000); // Verificar a cada 2 segundos

    // Parar polling após 10 minutos
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('⏰ Polling finalizado por timeout');
    }, 10 * 60 * 1000);

    return pollInterval;
  };

  const handleCreatePayment = async () => {
    setIsCreatingPayment(true);
    
    try {
      console.log('💳 Starting payment process...');
      console.log('💳 SessionStorage keys:', Object.keys(sessionStorage));
      console.log('💳 Payment data in sessionStorage:', sessionStorage.getItem('paymentData'));

      // Buscar dados do pagamento do sessionStorage
      const storedPaymentData = sessionStorage.getItem('paymentData');
      if (!storedPaymentData) {
        console.error('❌ Payment data not found in sessionStorage');
        throw new Error('Dados do pagamento não encontrados');
      }

      const paymentData = JSON.parse(storedPaymentData);
      console.log('💳 Payment data from storage:', paymentData);

      // Buscar preference_id do sessionStorage (já criado pelo OnlineBooking)
      const preferenceId = sessionStorage.getItem('lastPaymentPreferenceId');
      if (!preferenceId) {
        throw new Error('Preferência de pagamento não encontrada');
      }

      console.log('💳 Preference ID encontrado:', preferenceId);

      // Buscar URL de pagamento da preferência criada
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            // Buscar dados da preferência criada
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
                  throw new Error('Registro de pagamento não encontrado');
                }
              } catch (createError) {
                console.error('❌ [DEBUG] Falha ao criar registro automaticamente:', createError);
                throw new Error('Registro de pagamento não encontrado');
              }
            }

      const url = paymentRecord.init_point;
      if (!url) {
        throw new Error('URL de pagamento não encontrada');
      }

      setPaymentUrl(url);
      setPaymentCreated(true);

      console.log('🔗 Payment URL:', url);
      
      // Salvar o preference_id no sessionStorage para verificação posterior
      sessionStorage.setItem('lastPaymentPreferenceId', preferenceId);
      console.log('💾 Preference ID salvo:', preferenceId);

      // Log the URL type for debugging
      if (url.includes('sandbox')) {
        console.log('⚠️ WARNING: Using sandbox URL - check production configuration');
        toast({
          title: '⚠️ URL de Sandbox',
          description: 'Usando URL de sandbox. Verifique as configurações de produção.',
          variant: 'destructive',
          duration: 5000,
        });
      } else {
        console.log('✅ Using production URL');
      }

      // Configurar listener do Realtime ANTES de abrir a janela
      const cleanup = setupRealtimeListener();
      
      // Armazenar função de cleanup para usar quando necessário
      (window as any).realtimeCleanup = cleanup;

      // Iniciar polling como backup (caso Realtime falhe)
      const pollInterval = startPolling();
      (window as any).pollInterval = pollInterval;

      // Try to open payment window
      const paymentWindow = window.open(url, 'MercadoPago', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (paymentWindow) {
        console.log('✅ Payment window opened successfully');
        console.log('🔍 Aguardando confirmação via webhook...');
        
        // Mostrar mensagem de aguardando pagamento
        toast({
          title: 'Aguardando Pagamento',
          description: 'Estamos processando seu pagamento. Seu agendamento será confirmado automaticamente assim que o pagamento for aprovado.',
          variant: 'default',
        });

        // Monitorar fechamento da janela
        const checkClosed = setInterval(() => {
          if (paymentWindow.closed) {
            clearInterval(checkClosed);
            console.log('🔒 Payment window was closed');
            // Não chamar onPaymentSuccess - o webhook processará o pagamento
            // Apenas mostrar mensagem de processamento
            console.log('⏳ Aguardando processamento do pagamento pelo webhook...');
          }
        }, 1000);

        // Parar verificação após 5 minutos
        setTimeout(() => {
          clearInterval(checkClosed);
        }, 5 * 60 * 1000);
      } else {
        console.warn('⚠️ Could not open payment window - popup blocker detected');
        toast({
          title: 'Bloqueador de Pop-ups Detectado',
          description: 'Por favor, permita pop-ups para este site ou use o link direto abaixo.',
          variant: 'destructive',
        });
        
        // Mostrar link direto como alternativa
        setPaymentCreated(true);
      }
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      
      let errorMessage = 'Não foi possível processar o pagamento.';
      
      if (error.message) {
        if (error.message.includes('Mercado Pago not configured')) {
          errorMessage = 'Mercado Pago não está configurado para esta quadra.';
        } else if (error.message.includes('Mercado Pago not enabled')) {
          errorMessage = 'Mercado Pago não está habilitado.';
        } else if (error.message.includes('Missing required fields')) {
          errorMessage = 'Dados do pagamento incompletos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro no Pagamento',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleOpenPaymentLink = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Pagamento Seguro
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Processado pelo Mercado Pago
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Resumo do Pagamento */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Resumo do Pagamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Modalidade:</span>
                  <span className="font-medium">{modalityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-green-600">
                  <span>Total:</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              </div>
            </div>

            {/* Métodos Aceitos */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Métodos Aceitos</h4>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Cartão</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                  <span className="text-sm font-medium">PIX</span>
                </div>
              </div>
            </div>

            {/* Pagamento Seguro */}
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

            {/* Botões de Ação */}
            <div className="space-y-3">
              {!paymentCreated ? (
                <Button
                  onClick={handleCreatePayment}
                  disabled={isCreatingPayment}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isCreatingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar com Mercado Pago
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 text-center">
                      ✅ Link de pagamento criado com sucesso!
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleOpenPaymentLink}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Pagamento
                  </Button>
                </div>
              )}
              
              <Button
                onClick={onPaymentCancel}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
            </div>

            {/* Link direto se disponível */}
            {paymentUrl && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                  <p className="text-sm font-medium text-blue-800">
                    Link de Pagamento Direto
                  </p>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Se a janela de pagamento não abriu, clique no botão acima ou use o link:
                </p>
                <details className="mt-3">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                    Ver URL completa
                  </summary>
                  <p className="text-xs text-blue-600 mt-1 break-all font-mono bg-blue-100 p-2 rounded">
                    {paymentUrl}
                  </p>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export { PaymentCheckout };