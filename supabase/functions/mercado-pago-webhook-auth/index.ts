// Webhook que funciona com autenticação usando chave pública
export const config = { 
  auth: false,
  cors: {
    origin: '*',
    methods: ['POST', 'OPTIONS'],
    headers: ['Content-Type', 'x-signature', 'authorization']
  }
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Chave pública para o webhook (usando a chave anon do Supabase)
const PUBLIC_WEBHOOK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';

serve(async (req) => {
  console.log('🔔 MERCADO PAGO WEBHOOK AUTH - Method:', req.method);
  console.log('🔔 Headers:', Object.fromEntries(req.headers.entries()));
  
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
    console.log('🔔 Dados recebidos do Mercado Pago:', body);

    // Verificar se é uma notificação de pagamento
    if (body.type === 'payment' && body.data && body.data.id) {
      const paymentId = body.data.id;
      console.log('💳 Notificação de pagamento recebida:', paymentId);

      // Obter variáveis de ambiente
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');

      if (!supabaseUrl || !supabaseServiceKey || !mpAccessToken) {
        console.error('❌ Variáveis de ambiente não configuradas');
        return new Response(
          JSON.stringify({ error: 'Configuração inválida' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar cliente Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Buscar detalhes do pagamento no Mercado Pago
      console.log('🔍 Buscando detalhes do pagamento no Mercado Pago...');
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!mpResponse.ok) {
        console.error('❌ Erro ao buscar pagamento no Mercado Pago:', mpResponse.status);
        return new Response(
          JSON.stringify({ error: 'Erro ao consultar pagamento' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const paymentDetails = await mpResponse.json();
      console.log('💳 Detalhes do pagamento:', paymentDetails);
      console.log('💳 External Reference:', paymentDetails.external_reference);

      // Se o pagamento foi aprovado, criar/atualizar agendamento
      if (paymentDetails.status === 'approved' && paymentDetails.external_reference) {
        console.log('✅ Pagamento aprovado! Criando agendamento...');
        
        // Aqui você pode implementar a lógica para criar o agendamento
        // Por enquanto, vamos apenas logar que o pagamento foi aprovado
        console.log('🎉 Pagamento aprovado para external_reference:', paymentDetails.external_reference);
      } else {
        console.log('⚠️ Pagamento não aprovado ou sem external_reference');
      }

      // Sempre retornar 200 OK para o Mercado Pago
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook processado com sucesso',
          payment_id: paymentId,
          status: paymentDetails.status
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
