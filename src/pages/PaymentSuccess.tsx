import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Loader2, Clock } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Obter parâmetros da URL
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const externalReference = searchParams.get('external_reference');
        const preferenceId = searchParams.get('preference_id');

        console.log('🎉 Payment Success - Parâmetros:', {
          paymentId,
          status,
          externalReference,
          preferenceId
        });

        if (!paymentId || !status) {
          throw new Error('Parâmetros de pagamento não encontrados');
        }

        // Verificar status do pagamento usando nossa função de validação
        const validationResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            payment_id: paymentId,
            external_reference: externalReference,
            preference_id: preferenceId
          })
        });

        if (!validationResponse.ok) {
          const errorData = await validationResponse.json();
          throw new Error(`Erro ao validar pagamento: ${errorData.error || 'Erro desconhecido'}`);
        }

        const validationResult = await validationResponse.json();
        console.log('💳 Resultado da validação:', validationResult);

        if (validationResult.success && validationResult.payment_status === 'approved') {
          // Pagamento aprovado e agendamento processado
          if (validationResult.appointment) {
            setAppointmentData(validationResult.appointment);
            console.log('✅ Agendamento confirmado:', validationResult.appointment);
            
            // Mostrar tela de confirmação
            setShowConfirmation(true);
            setLoading(false);
            
            // Redirecionar após 5 segundos (igual ao agendamento sem pagamento)
            setTimeout(() => {
              // Recarregar a página para atualizar os dados
              window.location.href = '/';
            }, 5000);
          }
        } else {
          throw new Error(validationResult.message || 'Pagamento não aprovado');
        }
      } catch (err) {
        console.error('❌ Erro ao processar pagamento:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processando pagamento...
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto confirmamos seu pagamento
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro no Pagamento
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Success state - Reserva confirmada (igual ao agendamento sem pagamento)
  if (showConfirmation && appointmentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Reserva Confirmada!
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Seu agendamento foi confirmado com sucesso após o pagamento.
            </p>
          </div>

          {/* Detalhes da reserva */}
          <div className="bg-white rounded-xl shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Data:</span>
              <span className="font-medium text-slate-900">
                {new Date(appointmentData.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Horário:</span>
              <span className="font-medium text-slate-900">{appointmentData.time}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Modalidade:</span>
              <span className="font-medium text-slate-900">
                {appointmentData.modality_name || 'Vôlei'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Status:</span>
              <span className="font-medium text-green-600">Confirmado</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-500 text-sm">
              Você será redirecionado automaticamente em alguns segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback caso não tenha dados do agendamento
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Pagamento Aprovado!
        </h2>
        <p className="text-gray-600 mb-6">
          Seu agendamento foi confirmado com sucesso.
        </p>
        
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
}
