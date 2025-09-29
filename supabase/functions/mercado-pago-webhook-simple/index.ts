export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('🔔 MERCADO PAGO WEBHOOK SIMPLE - Method:', req.method);
  console.log('🔔 Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      console.log('⚠️ Non-POST request, returning 200');
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    // Obter o corpo da requisição
    let body;
    try {
      body = await req.json();
      console.log('🔔 Dados recebidos do Mercado Pago:', body);
    } catch (error) {
      console.log('⚠️ Erro ao parsear JSON, retornando 200 OK');
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    // Verificar se é uma notificação de pagamento
    if (body.type === 'payment' && body.data && body.data.id) {
      const paymentId = body.data.id;
      console.log('💳 Notificação de pagamento recebida:', paymentId);

      // Inicializar Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Variáveis de ambiente não configuradas');
        return new Response('ok', { status: 200, headers: corsHeaders });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      try {
        // Buscar o pagamento na API do Mercado Pago para obter detalhes
        // Primeiro, precisamos encontrar o owner_id através do preference_id
        const preferenceId = body.data.preference_id;
        if (!preferenceId) {
          console.log('⚠️ Preference ID não encontrado na notificação');
          return new Response('ok', { status: 200, headers: corsHeaders });
        }

        // Buscar registro de pagamento
        const { data: paymentRecord, error: recordError } = await supabase
          .from('payment_records')
          .select('*')
          .eq('preference_id', preferenceId)
          .single();

        if (recordError || !paymentRecord) {
          console.error('❌ Registro de pagamento não encontrado:', recordError);
          return new Response('ok', { status: 200, headers: corsHeaders });
        }

        console.log('✅ Registro de pagamento encontrado:', paymentRecord.id);

        // Buscar configurações do admin
        const { data: adminSettings, error: settingsError } = await supabase
          .from('settings')
          .select('mercado_pago_access_token')
          .eq('user_id', paymentRecord.owner_id)
          .single();

        if (settingsError || !adminSettings?.mercado_pago_access_token) {
          console.error('❌ Configurações do admin não encontradas:', settingsError);
          return new Response('ok', { status: 200, headers: corsHeaders });
        }

        // Buscar detalhes do pagamento na API do Mercado Pago
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!mpResponse.ok) {
          console.error('❌ Erro ao buscar detalhes do pagamento:', mpResponse.status);
          return new Response('ok', { status: 200, headers: corsHeaders });
        }

        const paymentDetails = await mpResponse.json();
        console.log('💳 Detalhes do pagamento:', paymentDetails.status);

        // Se o pagamento foi aprovado, confirmar o agendamento
        if (paymentDetails.status === 'approved') {
          console.log('✅ Pagamento aprovado - confirmando agendamento');

          // Atualizar status do registro de pagamento
          await supabase
            .from('payment_records')
            .update({
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentRecord.id);

          // Confirmar agendamento
          await supabase
            .from('appointments')
            .update({
              status: 'confirmed',
              payment_status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentRecord.booking_id);

          console.log('✅ Agendamento confirmado:', paymentRecord.booking_id);
        } else {
          console.log('ℹ️ Status do pagamento:', paymentDetails.status);
        }

        // Salvar notificação para histórico
        await supabase
          .from('webhook_notifications')
          .insert({
            payment_id: paymentId,
            preference_id: preferenceId,
            owner_id: paymentRecord.owner_id,
            booking_id: paymentRecord.booking_id,
            status: paymentDetails.status,
            raw_data: paymentDetails,
            processed_at: new Date().toISOString()
          });

      } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);
      }

      // Sempre retornar 200 OK para o Mercado Pago
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook processado com sucesso',
          payment_id: paymentId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.log('⚠️ Notificação não é de pagamento ou dados inválidos');
      return new Response(
        JSON.stringify({ error: 'Tipo de notificação não suportado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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