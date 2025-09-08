export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

serve(async (req) => {
  console.log('🚀 MERCADO PAGO WEBHOOK SIMPLES - Method:', req.method);
  console.log('🚀 MERCADO PAGO WEBHOOK SIMPLES - URL:', req.url);
  console.log('🚀 MERCADO PAGO WEBHOOK SIMPLES - Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request - returning ok');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log('🚀 MERCADO PAGO WEBHOOK SIMPLES - Body:', body);
    
    // Sempre responder 200 OK
    console.log('✅ MERCADO PAGO WEBHOOK SIMPLES - Retornando 200 OK');
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ Erro no mercado pago webhook simples:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
