export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('🚀 WEBHOOK CHAMADO - Method:', req.method);
  console.log('🚀 WEBHOOK CHAMADO - URL:', req.url);
  console.log('🚀 WEBHOOK CHAMADO - Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Se não for POST, retornar 200 OK
    if (req.method !== 'POST') {
      console.log('⚠️ Non-POST request, returning 200');
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    // Obter o corpo da requisição
    const body = await req.json();
    console.log('🔔 Webhook recebido:', JSON.stringify(body, null, 2));

    // Pega o ID do pagamento enviado pelo Mercado Pago
    const paymentId = body?.data?.id;
    if (!paymentId) {
      console.error('❌ ID do pagamento não encontrado');
      return new Response("ID do pagamento não encontrado", { status: 400, headers: corsHeaders });
    }

    console.log('💳 Processando pagamento ID:', paymentId);

    // Obter variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas');
      return new Response("Configuração inválida", { status: 500, headers: corsHeaders });
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do administrador (precisamos do access_token)
    const { data: allSettings, error: settingsError } = await supabase
      .from('settings')
      .select('user_id, mercado_pago_access_token')
      .not('mercado_pago_access_token', 'is', null);

    if (settingsError || !allSettings || allSettings.length === 0) {
      console.error('❌ Nenhum access token do Mercado Pago encontrado');
      return new Response("Mercado Pago not configured", { status: 400, headers: corsHeaders });
    }

    // Usar o primeiro token encontrado
    const mpAccessToken = allSettings[0].mercado_pago_access_token;
    const adminUserId = allSettings[0].user_id;

    console.log('🔍 Usando access token do admin:', adminUserId);

    // Consulta detalhes do pagamento no Mercado Pago
    console.log('🔍 Consultando detalhes do pagamento no Mercado Pago...');
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpRes.ok) {
      console.error('❌ Erro ao consultar pagamento no Mercado Pago:', mpRes.status);
      return new Response("Erro ao consultar pagamento", { status: 500, headers: corsHeaders });
    }

    const payment = await mpRes.json();
    console.log('💳 Detalhes do pagamento:', payment);
    console.log('💳 Status do pagamento:', payment.status);

    // Verificar se o pagamento foi aprovado
    if (payment.status === "approved") {
      console.log('✅ Pagamento aprovado - Criando agendamento');
      
      // Extrair dados do pagamento para criar o agendamento
      const appointmentData = {
        modalidade: payment.description || 'Agendamento',
        cliente: payment.payer?.first_name || 'Cliente',
        email: payment.payer?.email || '',
        valor: payment.transaction_amount || 0,
        pagamento_id: payment.id,
        status_pagamento: payment.status,
        criado_em: new Date().toISOString()
      };

      console.log('🔍 Dados do agendamento:', appointmentData);

      // Inserir agendamento no Supabase
      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          user_id: adminUserId,
          client_id: payment.payer?.email || '',
          date: new Date().toISOString(),
          status: 'agendado',
          modality: appointmentData.modalidade,
          valor_total: appointmentData.valor,
          payment_status: 'approved',
          booking_source: 'online',
          created_at: appointmentData.criado_em,
          updated_at: appointmentData.criado_em
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir agendamento:', insertError);
        return new Response("Erro ao salvar agendamento", { status: 500, headers: corsHeaders });
      }

      console.log('✅ Agendamento criado com sucesso:', newAppointment.id);
      return new Response("Agendamento confirmado", { status: 200, headers: corsHeaders });
    } else {
      console.log('⚠️ Pagamento não aprovado, ignorado. Status:', payment.status);
      return new Response("Pagamento não aprovado, ignorado", { status: 200, headers: corsHeaders });
    }

  } catch (error) {
    console.error('❌ Erro webhook:', error);
    return new Response("Erro interno", { status: 500, headers: corsHeaders });
  }
});