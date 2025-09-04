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
    console.log('🚀 DEBUG Payment function started')

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
    console.log('🔍 Looking for user settings:', user_id)
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('mercado_pago_access_token, mercado_pago_enabled')
      .eq('user_id', user_id)
      .single()

    console.log('🔍 Settings query result:', { settings, settingsError })

    if (settingsError) {
      console.error('❌ Settings query error:', settingsError)
      return new Response(
        JSON.stringify({ 
          error: 'Settings query failed', 
          details: settingsError.message,
          code: settingsError.code 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!settings) {
      console.error('❌ No settings found for user:', user_id)
      return new Response(
        JSON.stringify({ 
          error: 'No settings found for user',
          user_id: user_id 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Settings found:', {
      mercado_pago_enabled: settings.mercado_pago_enabled,
      has_token: !!settings.mercado_pago_access_token,
      token_preview: settings.mercado_pago_access_token ? settings.mercado_pago_access_token.substring(0, 10) + '...' : 'none'
    })

    if (!settings.mercado_pago_enabled) {
      console.error('❌ Mercado Pago not enabled')
      return new Response(
        JSON.stringify({ 
          error: 'Mercado Pago not enabled',
          mercado_pago_enabled: settings.mercado_pago_enabled 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!settings.mercado_pago_access_token) {
      console.error('❌ Mercado Pago token missing')
      return new Response(
        JSON.stringify({ 
          error: 'Mercado Pago token missing',
          has_token: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token is production or test
    const isTestToken = settings.mercado_pago_access_token.startsWith('TEST-')
    console.log('🔍 Token type:', isTestToken ? 'TEST (Sandbox)' : 'PRODUCTION')

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

    console.log('💳 Creating Mercado Pago preference with data:', preferenceData)

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.mercado_pago_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    })

    console.log('🔍 Mercado Pago response status:', mpResponse.status)
    console.log('🔍 Mercado Pago response ok:', mpResponse.ok)

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text()
      console.error('❌ Mercado Pago error:', {
        status: mpResponse.status,
        statusText: mpResponse.statusText,
        error: errorText
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment preference', 
          details: errorText,
          status: mpResponse.status,
          token_type: isTestToken ? 'TEST' : 'PRODUCTION'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const preference = await mpResponse.json()
    console.log('✅ Preference created successfully:', {
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point
    })

    // Save payment record if appointment_id exists
    if (appointment_id) {
      console.log('💾 Saving payment record for appointment:', appointment_id)
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          appointment_id,
          amount,
          currency: 'BRL',
          status: 'pending',
          mercado_pago_id: preference.id,
          payment_method: 'mercado_pago'
        })

      if (paymentError) {
        console.error('❌ Error saving payment:', paymentError)
      } else {
        console.log('✅ Payment record saved')
      }

      // Update appointment status
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ payment_status: 'pending' })
        .eq('id', appointment_id)

      if (appointmentError) {
        console.error('❌ Error updating appointment:', appointmentError)
      } else {
        console.log('✅ Appointment status updated')
      }
    }

    // Return success response
    const response = {
      success: true,
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      token_type: isTestToken ? 'TEST' : 'PRODUCTION',
      debug_info: {
        user_id,
        amount,
        description,
        client_name,
        client_email
      }
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
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
