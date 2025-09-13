import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PaymentCheckoutTransparentProps {
  appointmentId: string;
  userId: string;
  amount: number;
  modalityName: string;
  clientName: string;
  clientEmail: string;
  onPaymentSuccess: () => void;
}

const PaymentCheckoutTransparent: React.FC<PaymentCheckoutTransparentProps> = ({
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
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para processar pagamento diretamente via API do Mercado Pago
  const processPayment = async (paymentMethod: 'pix' | 'credit_card') => {
    try {
      setIsLoading(true);
      console.log('💳 [FRONTEND] Processando pagamento transparente...');

      // Buscar dados do pagamento do sessionStorage
      const storedPaymentData = sessionStorage.getItem('paymentData');
      if (!storedPaymentData) {
        throw new Error('Dados do pagamento não encontrados');
      }

      const appointmentData = JSON.parse(storedPaymentData);
      console.log('🔍 [FRONTEND] Dados do agendamento:', appointmentData);

      // Gerar ID único para o agendamento
      const appointmentId = `appointment_${Date.now()}_${appointmentData.appointment_data.client_id}`;

      // Dados do pagamento para o Mercado Pago
      const paymentData = {
        transaction_amount: amount,
        description: `Agendamento de ${modalityName}`,
        payment_method_id: paymentMethod,
        payer: {
          email: clientEmail,
          identification: {
            type: "CPF",
            number: "12345678901" // CPF fictício para teste
          }
        },
        external_reference: appointmentId,
        installments: 1,
        capture: true
      };

      console.log('💳 [FRONTEND] Enviando pagamento para Mercado Pago...', paymentData);

      // Fazer requisição direta para a API do Mercado Pago
      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer APP_USR-4461346537954793-090413-6c5cc021ed6566a910dbace683f270ae-620810417`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FRONTEND] Erro do Mercado Pago:', errorText);
        throw new Error(`Erro do Mercado Pago: ${errorText}`);
      }

      const payment = await response.json();
      console.log('✅ [FRONTEND] Pagamento criado:', payment);

      setPaymentData(payment);
      setPaymentStatus(payment.status);

      if (payment.status === 'approved') {
        // Pagamento aprovado - criar agendamento
        console.log('✅ [FRONTEND] Pagamento aprovado, criando agendamento...');
        
        const { data: newAppointment, error: createError } = await supabase
          .from('appointments')
          .insert({
            id: appointmentId,
            user_id: appointmentData.appointment_data.user_id,
            client_id: appointmentData.appointment_data.client_id,
            date: appointmentData.appointment_data.date,
            time: appointmentData.appointment_data.time,
            modality_id: appointmentData.appointment_data.modality_id,
            modality_name: appointmentData.appointment_data.modality_name,
            valor_total: appointmentData.appointment_data.valor_total,
            status: 'agendado',
            payment_status: 'paid',
            payment_id: payment.id,
            booking_source: 'online',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ [FRONTEND] Erro ao criar agendamento:', createError);
          throw new Error('Erro ao criar agendamento');
        }

        console.log('✅ [FRONTEND] Agendamento criado:', newAppointment);
        
        toast({
          title: "Pagamento Aprovado!",
          description: "Seu agendamento foi confirmado com sucesso.",
        });
        onPaymentSuccess();
      } else if (payment.status === 'pending') {
        toast({
          title: "Pagamento Pendente",
          description: "Aguarde a confirmação do pagamento. Você receberá uma notificação quando for aprovado.",
        });
      } else {
        toast({
          title: "Pagamento Rejeitado",
          description: "O pagamento não foi aprovado. Tente novamente.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao processar pagamento:', error);
      toast({
        title: "Erro no Pagamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

          {paymentData && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Detalhes do Pagamento:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID do Pagamento:</span>
                  <span className="font-medium">{paymentData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{paymentData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-bold text-green-600">{formatCurrency(amount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">Pagamento Pendente</h3>
          </div>
          
          <p className="text-yellow-700 mb-4">
            Seu pagamento está sendo processado. Você receberá uma notificação quando for aprovado.
          </p>

          {paymentData && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Detalhes do Pagamento:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID do Pagamento:</span>
                  <span className="font-medium">{paymentData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{paymentData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-bold text-green-600">{formatCurrency(amount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Pagamento Transparente</h3>
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

      <div className="space-y-3">
        <Button
          onClick={() => processPayment('pix')}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando Pagamento...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar com Pix
            </>
          )}
        </Button>

        <Button
          onClick={() => processPayment('credit_card')}
          disabled={isLoading}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando Pagamento...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar com Cartão
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentCheckoutTransparent;
