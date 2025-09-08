export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('🚀 WEBHOOK FIXED - Method:', req.method);
  console.log('🚀 WEBHOOK FIXED - URL:', req.url);
  console.log('🚀 WEBHOOK FIXED - Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request - returning ok');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar se é uma requisição do Mercado Pago
    const userAgent = req.headers.get('user-agent');
    if (userAgent && userAgent.includes('MercadoPago')) {
      console.log('✅ Requisição do Mercado Pago detectada');
    } else {
      console.log('⚠️ Requisição não é do Mercado Pago');
    }
    
    // Aceitar qualquer método para debug
    console.log('🔍 Processando requisição - Method:', req.method);
    
    // Se não for POST, retornar 200 OK para evitar erros
    if (req.method !== 'POST') {
      console.log('⚠️ Método não é POST, retornando 200 OK');
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    // Obter o corpo da requisição
    const rawBody = await req.text();
    console.log('🔔 Raw body length:', rawBody.length);
    console.log('🔔 Raw body content:', rawBody);

    // Parse do JSON
    const notification = JSON.parse(rawBody);
    console.log('🔔 Dados da notificação:', notification);

    // Verificar se é uma notificação de pagamento
    if (notification.type !== 'payment') {
      console.log('⚠️ Tipo de notificação não é payment:', notification.type);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // Verificar se tem ID do pagamento
    if (!notification.data?.id) {
      console.error('❌ ID do pagamento não encontrado');
      return new Response("No payment id", { status: 400, headers: corsHeaders });
    }

    const paymentId = notification.data.id;
    console.log('💳 Processando pagamento ID:', paymentId);

    // Por enquanto, apenas logar e retornar OK
    console.log('✅ WEBHOOK FIXED PROCESSADO COM SUCESSO - Retornando 200 OK');
    return new Response("ok", { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Erro no webhook fixed:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
