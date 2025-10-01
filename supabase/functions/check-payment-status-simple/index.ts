export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('🔍 CHECK PAYMENT STATUS SIMPLE - Method:', req.method);
  console.log('🔍 CHECK PAYMENT STATUS SIMPLE - URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      console.log('⚠️ Non-POST request, returning 405');
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const body = await req.json();
    console.log('🔍 Dados recebidos:', body);

    const { preference_id } = body;
    console.log('🔍 Preference ID:', preference_id);

    if (!preference_id) {
      console.error('❌ Preference ID não fornecido');
      return new Response(
        JSON.stringify({ error: 'Preference ID é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas');
      return new Response(
        JSON.stringify({ error: 'Configuração inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do pagamento na tabela payment_records
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_records')
      .select('*')
      .eq('preference_id', preference_id)
      .single();

    if (paymentError) {
      console.error('❌ Erro ao buscar pagamento:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Pagamento não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!paymentRecord) {
      console.log('⚠️ Pagamento não encontrado para preference_id:', preference_id);
      return new Response(
        JSON.stringify({ error: 'Pagamento não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Pagamento encontrado:', {
      id: paymentRecord.id,
      status: paymentRecord.status,
      booking_id: paymentRecord.booking_id,
      preference_id: paymentRecord.preference_id
    });

    // Buscar dados do agendamento
    let appointmentData: any = null;
    
    // Primeiro tentar buscar por booking_id se disponível
    if (paymentRecord.booking_id) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', paymentRecord.booking_id)
        .single();

      if (!appointmentError && appointment) {
        appointmentData = {
          id: appointment.id,
          status: appointment.status,
          date: appointment.date,
          time: appointment.time,
          modality_id: appointment.modality_id,
          client_id: appointment.client_id,
          created_at: appointment.created_at
        };
        console.log('✅ Agendamento encontrado por booking_id:', appointmentData);
      }
    }
    
    // Se não encontrou por booking_id, tentar buscar por preference_id no payment_data
    if (!appointmentData) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .contains('payment_data', { preference_id: paymentRecord.preference_id })
        .single();

      if (!appointmentError && appointment) {
        appointmentData = {
          id: appointment.id,
          status: appointment.status,
          date: appointment.date,
          time: appointment.time,
          modality_id: appointment.modality_id,
          client_id: appointment.client_id,
          created_at: appointment.created_at
        };
        console.log('✅ Agendamento encontrado por preference_id:', appointmentData);
      }
    }

    // Verificar se o pagamento foi aprovado via API do Mercado Pago
    let paymentStatus = paymentRecord.status;
    let mercadoPagoStatus = null;

    if (paymentRecord.owner_id) {
      try {
        // Buscar configurações do admin
        const { data: adminSettings, error: settingsError } = await supabase
          .from('settings')
          .select('mercado_pago_access_token')
          .eq('user_id', paymentRecord.owner_id)
          .single();

        if (!settingsError && adminSettings?.mercado_pago_access_token) {
          // Consultar API do Mercado Pago
          const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${paymentRecord.booking_id}`, {
            headers: {
              'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (mpResponse.ok) {
            const mpData = await mpResponse.json();
            if (mpData.results && mpData.results.length > 0) {
              const latestPayment = mpData.results[0];
              mercadoPagoStatus = latestPayment.status;
              console.log('🔍 Status do Mercado Pago:', mercadoPagoStatus);

              // Se o pagamento foi aprovado no MP mas não confirmado localmente
              if (mercadoPagoStatus === 'approved' && paymentRecord.status !== 'confirmed') {
                console.log('✅ Pagamento aprovado no MP - confirmando agendamento');
                
                // Atualizar status do pagamento
                await supabase
                  .from('payment_records')
                  .update({ 
                    status: 'confirmed',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', paymentRecord.id);

                // Confirmar agendamento
                if (appointmentData) {
                  await supabase
                    .from('appointments')
                    .update({
                      status: 'confirmed',
                      payment_status: 'approved',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', paymentRecord.booking_id);
                }

                paymentStatus = 'confirmed';
                console.log('✅ Agendamento confirmado automaticamente');
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao consultar API do Mercado Pago:', error);
      }
    }

    const response = {
      success: true,
      preference_id: paymentRecord.preference_id,
      payment_status: paymentStatus,
      mercado_pago_status: mercadoPagoStatus,
      booking_id: paymentRecord.booking_id,
      appointment: appointmentData,
      created_at: paymentRecord.created_at,
      updated_at: paymentRecord.updated_at,
      // Flag para indicar se o agendamento foi confirmado
      is_confirmed: (paymentStatus === 'confirmed' || paymentStatus === 'approved') && appointmentData && appointmentData.status === 'confirmed',
      // Status do agendamento para o frontend
      appointment_status: appointmentData ? appointmentData.status : 'pending'
    };

    console.log('📤 Retornando status do pagamento:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});