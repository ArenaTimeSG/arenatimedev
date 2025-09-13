import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);

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

        // Verificar status do pagamento na API do Mercado Pago
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (!mpResponse.ok) {
          throw new Error('Erro ao verificar pagamento no Mercado Pago');
        }

        const paymentDetails = await mpResponse.json();
        console.log('💳 Detalhes do pagamento:', paymentDetails);

        if (paymentDetails.status === 'approved') {
          // Pagamento aprovado - criar/atualizar agendamento
          if (externalReference) {
            // Buscar dados do agendamento temporário
            const { data: tempAppointment, error: tempError } = await supabase
              .from('appointments')
              .select('*')
              .eq('id', externalReference)
              .single();

            if (tempError) {
              console.error('❌ Erro ao buscar agendamento temporário:', tempError);
            } else if (tempAppointment) {
              // Atualizar status do agendamento
              const { data: updatedAppointment, error: updateError } = await supabase
                .from('appointments')
                .update({
                  status: 'agendado',
                  payment_status: 'paid',
                  payment_id: paymentId,
                  updated_at: new Date().toISOString()
                })
                .eq('id', externalReference)
                .select()
                .single();

              if (updateError) {
                console.error('❌ Erro ao atualizar agendamento:', updateError);
                throw new Error('Erro ao confirmar agendamento');
              }

              setAppointmentData(updatedAppointment);
              console.log('✅ Agendamento confirmado:', updatedAppointment);
            }
          }
        } else {
          throw new Error(`Pagamento não aprovado. Status: ${paymentDetails.status}`);
        }

        setLoading(false);
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
        
        {appointmentData && (
          <div className="bg-white rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Detalhes do Agendamento:</h3>
            <p className="text-sm text-gray-600">
              <strong>Data:</strong> {new Date(appointmentData.date).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Horário:</strong> {appointmentData.time}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Modalidade:</strong> {appointmentData.modality_name || 'Vôlei'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Status:</strong> {appointmentData.status}
            </p>
          </div>
        )}

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
