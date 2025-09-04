import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🧪 Função de teste iniciada')
    
    const requestBody = await req.json()
    console.log('📥 Dados recebidos:', requestBody)
    
    // Retornar dados mockados do Mercado Pago
    const mockResponse = {
      success: true,
      payment_id: 'test-payment-123',
      preference_id: 'test-preference-456',
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test-preference-456',
      sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=test-preference-456',
      external_reference: requestBody.appointment_id || `temp_${Date.now()}`
    }
    
    console.log('✅ Retornando resposta mockada:', mockResponse)
    
    return new Response(
      JSON.stringify(mockResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro na função de teste:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro na função de teste',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
