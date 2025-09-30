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

    // Verificar se é uma notificação de pagamento ou merchant_order
    if ((body.type === 'payment' && body.data && body.data.id) || 
        (body.topic === 'merchant_order' && body.resource)) {
      
      let paymentId = null;
      
      if (body.type === 'payment' && body.data && body.data.id) {
        paymentId = body.data.id;
        console.log('💳 Notificação de pagamento recebida:', paymentId);
      } else if (body.topic === 'merchant_order' && body.resource) {
        console.log('💳 Notificação de merchant_order recebida:', body.resource);
        
        // Buscar detalhes do merchant_order para obter payment_id
        try {
          const mpResponse = await fetch(body.resource, {
            headers: {
              'Authorization': `Bearer ${Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (mpResponse.ok) {
            const merchantOrder = await mpResponse.json();
            console.log('💳 Merchant order details:', merchantOrder);
            
            // Buscar o payment_id do merchant_order
            if (merchantOrder.payments && merchantOrder.payments.length > 0) {
              paymentId = merchantOrder.payments[0].id;
              console.log('💳 Payment ID encontrado:', paymentId);
            }
          }
        } catch (error) {
          console.error('❌ Erro ao buscar merchant_order:', error);
        }
      }
      
      if (!paymentId) {
        console.log('⚠️ Payment ID não encontrado');
        return new Response('ok', { status: 200, headers: corsHeaders });
      }

      // Redirecionar para o webhook correto
      console.log('🔄 Redirecionando para notification-webhook...');
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Variáveis de ambiente não configuradas');
        return new Response('ok', { status: 200, headers: corsHeaders });
      }

      // Chamar o webhook correto
      try {
        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/notification-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify(body)
        });

        console.log('✅ Webhook redirecionado com sucesso:', webhookResponse.status);
        return new Response('ok', { status: 200, headers: corsHeaders });
      } catch (error) {
        console.error('❌ Erro ao redirecionar webhook:', error);
        return new Response('ok', { status: 200, headers: corsHeaders });
      }
    } else {
      console.log('⚠️ Notificação não é de pagamento ou dados inválidos');
      console.log('🔍 Body recebido:', JSON.stringify(body, null, 2));
      console.log('🔍 Tipo:', body.type, 'Topic:', body.topic);
      console.log('🔍 Data:', body.data, 'Resource:', body.resource);
      return new Response('ok', { status: 200, headers: corsHeaders });
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