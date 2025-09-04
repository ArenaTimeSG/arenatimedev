import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 PRODUCTION Payment function started')

    const body = await req.json()
    console.log('📥 Request body:', body)

    const { user_id, amount, description, client_name, client_email, appointment_id } = body

    // Validate required fields
    if (!user_id || !amount || !description || !client_name || !client_email) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user's Mercado Pago settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('mercado_pago_access_token, mercado_pago_enabled')
      .eq('user_id', user_id)
      .single()

    if (settingsError || !settings) {
      console.error('❌ Settings not found:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!settings.mercado_pago_enabled || !settings.mercado_pago_access_token) {
      console.error('❌ Mercado Pago not enabled or token missing')
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔑 Using Mercado Pago token:', settings.mercado_pago_access_token.substring(0, 10) + '...')

    // Create Mercado Pago preference
    const preferenceData = {
      items: [{
        title: description,
        description: `Agendamento para ${client_name}`,
        quantity: 1,
        unit_price: amount,
        currency_id: 'BRL'
      }],
      payer: {
        name: client_name,
        email: client_email
      },
      back_urls: {
        success: 'https://arenatime.vercel.app/payment/success',
        failure: 'https://arenatime.vercel.app/payment/failure',
        pending: 'https://arenatime.vercel.app/payment/pending'
      },
      auto_return: 'approved',
      external_reference: appointment_id || `temp_${Date.now()}`
    }

    console.log('💳 Creating REAL Mercado Pago preference...')

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.mercado_pago_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    })

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text()
      console.error('❌ Mercado Pago error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment preference', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const preference = await mpResponse.json()
    console.log('✅ REAL Preference created:', preference.id)
    console.log('🔗 Production URL:', preference.init_point)
    console.log('🔗 Sandbox URL:', preference.sandbox_init_point)

    // Save payment record if appointment_id exists
    if (appointment_id) {
      await supabase
        .from('payments')
        .insert({
          appointment_id,
          amount,
          currency: 'BRL',
          status: 'pending',
          mercado_pago_id: preference.id,
          payment_method: 'mercado_pago'
        })

      // Update appointment status
      await supabase
        .from('appointments')
        .update({ payment_status: 'pending' })
        .eq('id', appointment_id)
    }

    // Return success response - FORCE PRODUCTION URL
    const response = {
      success: true,
      preference_id: preference.id,
      init_point: preference.init_point,  // PRODUCTION URL
      sandbox_init_point: preference.sandbox_init_point
    }

    console.log('📤 Returning response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Payment function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Payment function failed',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
