export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

      // Por enquanto, apenas logar que recebemos a notificação
      console.log('✅ Webhook funcionando! Pagamento recebido:', paymentId);

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