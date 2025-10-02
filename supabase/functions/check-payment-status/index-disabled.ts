import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('🔍 Payment status check function started')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { external_reference, api_key } = await req.json()

    if (!external_reference) {
      return new Response(
        JSON.stringify({ error: 'external_reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar status do pagamento na tabela payment_records
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_records')
      .select('*')
      .eq('external_reference', external_reference)
      .single()

    if (paymentError || !paymentRecord) {
      console.error('❌ Erro ao buscar registro de pagamento:', paymentError)
      return new Response(
        JSON.stringify({ error: 'Payment record not found', details: paymentError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📊 Payment record found:', paymentRecord)

    // DESABILITADO: Criar novo agendamento - Webhook responsável
    console.log('🚫 IMPORTANTE: Criação de agendamento DESABILITADA nesta função');
    console.log('🚫 notification-webhook é responsável pela criação de agendamentos pagos');
    
    return new Response(
      JSON.stringify({
        success: true,
        payment_status: 'approved',
        message: 'Pagamento validado - agendamento será criado pelo webhook'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro na função:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
