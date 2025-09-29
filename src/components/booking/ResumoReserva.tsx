import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Mail, Phone, DollarSign, CheckCircle, CreditCard, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PaymentCheckoutTransparentComplete from './PaymentCheckoutTransparentComplete';
import PaymentDebug from './PaymentDebug';

interface Modalidade {
  id: string;
  name: string;
  duracao: number;
  valor: number;
  descricao: string;
  cor: string;
}

interface Cliente {
  nome: string;
  email: string;
  telefone: string;
}

interface Reserva {
  modalidade: Modalidade | null;
  data: Date | null;
  horario: string | null;
  cliente: Cliente;
}

interface ResumoReservaProps {
  reserva: Reserva;
  onConfirmar: () => void;
  onConfirmarComPagamento?: () => void;
  isCreating?: boolean;
  autoConfirmada?: boolean;
  paymentPolicy?: 'sem_pagamento' | 'obrigatorio' | 'opcional';
  appointmentId?: string;
  userId?: string;
  mercadoPagoPublicKey?: string;
}

const ResumoReserva = ({ 
  reserva, 
  onConfirmar, 
  onConfirmarComPagamento,
  isCreating = false,
  autoConfirmada = false,
  paymentPolicy = 'sem_pagamento',
  appointmentId,
  userId,
  mercadoPagoPublicKey
}: ResumoReservaProps) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<'pay' | 'no_pay' | null>(null);

  // Debug logs
  console.log('🔍 ResumoReserva - reserva.cliente:', reserva.cliente);
  console.log('🔍 ResumoReserva - reserva.cliente.nome:', reserva.cliente.nome);
  console.log('🔍 ResumoReserva - reserva.cliente.email:', reserva.cliente.email);



  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setPaymentChoice(null);
    // Após pagamento bem-sucedido, apenas mostrar mensagem de processamento
    // O agendamento será criado pelo webhook quando o pagamento for aprovado
    console.log('✅ Payment successful - agendamento será criado pelo webhook');
    // Não chamar onConfirmarComPagamento - o webhook criará o agendamento
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPaymentChoice(null);
  };

  const handleConfirmWithPayment = async () => {
    console.log('🔍 [DEBUG] handleConfirmWithPayment called');
    console.log('🔍 [DEBUG] paymentPolicy:', paymentPolicy);
    console.log('🔍 [DEBUG] onConfirmarComPagamento available:', !!onConfirmarComPagamento);
    
    if (paymentPolicy === 'obrigatorio') {
      // Para política obrigatória, primeiro processar pagamento (armazenar dados)
      // Depois abrir o modal de pagamento
      console.log('🔒 Payment required - processing payment first');
      try {
        console.log('🔍 [DEBUG] Calling onConfirmarComPagamento...');
        await onConfirmarComPagamento?.(); // ✅ Aguarda função que armazena dados
        console.log('✅ Payment data processed, opening modal');
        
        // Aguardar um pouco para garantir que os dados foram salvos
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verificar se os dados foram salvos
        const storedData = sessionStorage.getItem('paymentData');
        console.log('🔍 [DEBUG] Stored data check:', storedData ? 'Found' : 'Not found');
        console.log('🔍 [DEBUG] SessionStorage keys:', Object.keys(sessionStorage));
        
        if (!storedData) {
          console.error('❌ Payment data not found after processing');
          console.error('❌ Available sessionStorage keys:', Object.keys(sessionStorage));
          throw new Error('Dados do pagamento não foram salvos');
        }
        
        console.log('✅ Payment data verified, opening modal');
        setShowPayment(true);        // ✅ Depois abre modal
      } catch (error) {
        console.error('❌ Error processing payment:', error);
        console.error('❌ Error details:', error.message);
        // Não abrir modal se houver erro
      }
    } else if (paymentPolicy === 'opcional') {
      console.log('🔍 [DEBUG] Optional payment policy - processing payment first');
      try {
        console.log('🔍 [DEBUG] Calling onConfirmarComPagamento...');
        await onConfirmarComPagamento?.(); // ✅ Chama função que armazena dados
        console.log('✅ Payment data processed, opening modal');
        
        // Aguardar um pouco para garantir que os dados foram salvos
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verificar se os dados foram salvos
        const storedData = sessionStorage.getItem('paymentData');
        console.log('🔍 [DEBUG] Stored data check:', storedData ? 'Found' : 'Not found');
        
        if (!storedData) {
          console.error('❌ Payment data not found after processing');
          throw new Error('Dados do pagamento não foram salvos');
        }
        
        console.log('✅ Payment data verified, opening modal');
        setPaymentChoice('pay');
        setShowPayment(true); // ✅ Depois abre modal
      } catch (error) {
        console.error('❌ Error processing payment:', error);
        console.error('❌ Error details:', error.message);
        // Não abrir modal se houver erro
      }
    } else {
      console.log('🔍 [DEBUG] No payment policy - calling onConfirmar');
      onConfirmar();
    }
  };

  const handleConfirmWithoutPayment = () => {
    if (paymentPolicy === 'opcional') {
      setPaymentChoice('no_pay');
      onConfirmar();
    }
  };
  return (
    <div className="max-w-2xl mx-auto">
      {/* Resumo da Reserva */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Resumo da Reserva
        </h3>
        
        {/* Detalhes da reserva */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <div className={`w-12 h-12 ${reserva.modalidade?.cor} rounded-full flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">{reserva.modalidade?.name.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Modalidade</p>
              <p className="font-bold text-gray-800 text-lg">{reserva.modalidade?.name}</p>
              <p className="text-sm text-gray-600">{reserva.modalidade?.descricao}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Data e Horário</p>
              <p className="font-bold text-gray-800 text-lg">
                {reserva.data && format(reserva.data, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
              </p>
              <p className="text-sm text-gray-600">às {reserva.horario} ({reserva.modalidade?.duracao} minutos)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Valor da Reserva</p>
              <p className="font-bold text-gray-800 text-2xl">R$ {reserva.modalidade?.valor}</p>
              <p className="text-sm text-gray-600">
                {paymentPolicy === 'sem_pagamento' && 'Pagamento no local'}
                {paymentPolicy === 'opcional' && 'Pagamento opcional online'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Seus Dados
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-semibold text-gray-800">{reserva.cliente.nome}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">E-mail</p>
              <p className="font-semibold text-gray-800">{reserva.cliente.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-semibold text-gray-800">{reserva.cliente.telefone}</p>
            </div>
          </div>
        </div>
      </div>



      {/* Botões de Confirmação */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {paymentPolicy === 'sem_pagamento' && (
          <>
            <motion.button
              onClick={onConfirmar}
              disabled={isCreating}
              whileHover={{ scale: isCreating ? 1 : 1.02 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg
                       focus:outline-none focus:ring-2 focus:ring-offset-2
                       transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2
                       ${isCreating 
                         ? 'bg-gray-400 text-white cursor-not-allowed' 
                         : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                       }`}
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {autoConfirmada ? 'Confirmar Reserva' : 'Solicitar Reserva'}
                </>
              )}
            </motion.button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              {autoConfirmada 
                ? 'Sua reserva será confirmada automaticamente'
                : 'Sua solicitação será enviada para aprovação'
              }
            </p>
          </>
        )}

        {paymentPolicy === 'obrigatorio' && (
          <>
            <motion.button
              onClick={handleConfirmWithPayment}
              disabled={isCreating}
              whileHover={{ scale: isCreating ? 1 : 1.02 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg
                       focus:outline-none focus:ring-2 focus:ring-offset-2
                       transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2
                       ${isCreating 
                         ? 'bg-gray-400 text-white cursor-not-allowed' 
                         : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                       }`}
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pagar e Confirmar Reserva
                </>
              )}
            </motion.button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              {paymentPolicy === 'opcional' ? 'Pagamento opcional para confirmar o agendamento' : 'Pagamento no local'}
            </p>
          </>
        )}

        {paymentPolicy === 'opcional' && (
          <div className="space-y-3">
            <motion.button
              onClick={handleConfirmWithPayment}
              disabled={isCreating}
              whileHover={{ scale: isCreating ? 1 : 1.02 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg
                       focus:outline-none focus:ring-2 focus:ring-offset-2
                       transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2
                       ${isCreating 
                         ? 'bg-gray-400 text-white cursor-not-allowed' 
                         : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                       }`}
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pagar e Confirmar
                </>
              )}
            </motion.button>

            <motion.button
              onClick={handleConfirmWithoutPayment}
              disabled={isCreating}
              whileHover={{ scale: isCreating ? 1 : 1.02 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-base
                       focus:outline-none focus:ring-2 focus:ring-offset-2
                       transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2
                       ${isCreating 
                         ? 'bg-gray-400 text-white cursor-not-allowed' 
                         : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                       }`}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirmar sem Pagamento
                </>
              )}
            </motion.button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Você pode escolher pagar agora ou no local
            </p>
          </div>
        )}
      </div>

      {/* Modal de Pagamento */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            {/* Botão de fechar */}
            <button
              onClick={handlePaymentCancel}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
            
            {(() => {
              // Verificar se os dados do pagamento estão disponíveis
              const paymentData = sessionStorage.getItem('paymentData');
              if (!paymentData) {
                console.log('⏳ Aguardando dados do pagamento...');
                return (
                  <div className="p-4">
                    <PaymentDebug />
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Preparando pagamento...</p>
                      </div>
                    </div>
                  </div>
                );
              }
              
              console.log('✅ Dados do pagamento disponíveis, renderizando checkout');
              return (
                <PaymentCheckoutTransparentComplete
                  appointmentId={appointmentId || ''}
                  userId={userId || ''}
                  amount={reserva.modalidade?.valor || 0}
                  modalityName={reserva.modalidade?.name || ''}
                  clientName={reserva.cliente.nome}
                  clientEmail={reserva.cliente.email}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumoReserva;
