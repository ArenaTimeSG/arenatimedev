import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';

interface PaymentCheckoutProps {
  appointmentId?: string;
  userId?: string;
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

  const handleCreatePayment = async () => {
    setIsCreatingPayment(true);
    
    try {
      const paymentData = {
        appointment_id: appointmentId,
        user_id: userId,
        amount: amount,
        description: `Agendamento - ${modalityName}`,
        modality_name: modalityName,
        client_name: clientName,
        client_email: clientEmail,
      };
      
      console.log('💳 Dados do pagamento sendo enviados:', paymentData);
      
      const result = await createPaymentPreference(paymentData);

      console.log('💳 Resultado da preferência:', result);
      
      // Usar sandbox_init_point para desenvolvimento ou init_point para produção
      const url = result.sandbox_init_point || result.init_point;
      setPaymentUrl(url);
      
      // Abrir o checkout em uma nova janela
      const paymentWindow = window.open(url, 'MercadoPago', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (paymentWindow) {
        // Verificar se a janela foi fechada
        const checkClosed = setInterval(() => {
          if (paymentWindow.closed) {
            clearInterval(checkClosed);
            // Verificar status do pagamento
            setTimeout(() => {
              checkPaymentStatus();
            }, 2000);
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: 'Não foi possível criar a preferência de pagamento.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const checkPaymentStatus = async () => {
    // Aqui você pode implementar uma verificação do status do pagamento
    // Por enquanto, vamos simular um sucesso após 3 segundos
    setTimeout(() => {
      onPaymentSuccess();
    }, 3000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
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
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Modalidade:</span>
                <span className="font-medium">{modalityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">{clientName}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(amount)}</span>
              </div>
            </div>
          </div>

          {/* Métodos de Pagamento */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Métodos Aceitos</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Cartão</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">PIX</span>
              </div>
            </div>
          </div>

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

          {/* Botões de Ação */}
          <div className="space-y-3">
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
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">
                Se a janela de pagamento não abriu, clique no link:
              </p>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
              >
                {paymentUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { PaymentCheckout };
