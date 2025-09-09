import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  user_id: string;
  amount: number;
  description: string;
  client_name: string;
  client_email: string;
  booking_id: string; // ID do agendamento que será pago
  appointment_id?: string;
  appointment_data?: {
    client_id: string;
    date: string;
    modality: string;
    valor_total: number;
    payment_policy: string;
  };
}

serve(async (req) => {
  console.log('🚀 Payment function started');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📥 Request body:', JSON.stringify(body, null, 2));

    const { user_id, amount, description, client_name, client_email, booking_id, appointment_id, appointment_data } = body

    // Validate required fields
    if (!user_id || !amount || !description || !client_name || !client_email || !booking_id) {
      console.error('❌ Missing required fields:', { user_id: !!user_id, amount: !!amount, description: !!description, client_name: !!client_name, client_email: !!client_email, booking_id: !!booking_id });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Supabase client configured');

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user's Mercado Pago settings
    console.log('🔍 Fetching user settings for user_id:', user_id);
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('mercado_pago_access_token, mercado_pago_enabled')
      .eq('user_id', user_id)
      .single()

    if (settingsError) {
      console.error('❌ Settings error:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Settings not found', details: settingsError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!settings) {
      console.error('❌ No settings found for user');
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Settings found:', { enabled: settings.mercado_pago_enabled, hasToken: !!settings.mercado_pago_access_token });

    if (!settings.mercado_pago_enabled || !settings.mercado_pago_access_token) {
      console.error('❌ Mercado Pago not enabled or token missing');
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Mercado Pago preference
    const externalRef = booking_id; // Usar o booking_id como external_reference
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
      external_reference: externalRef,
      notification_url: 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook' // URL do webhook
    }

    console.log('💳 Creating Mercado Pago preference...', JSON.stringify(preferenceData, null, 2));

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
    console.log('✅ Preference created:', preference.id)

    // Log payment info for webhook processing
    console.log('💾 Payment info for webhook:');
    console.log('  - Preference ID:', preference.id);
    console.log('  - External Reference (Booking ID):', externalRef);
    console.log('  - User ID:', user_id);
    console.log('  - Amount:', amount);
    console.log('  - Description:', description);
    console.log('  - Client Name:', client_name);
    console.log('  - Client Email:', client_email);
    console.log('  - Notification URL:', preferenceData.notification_url);
    
    // O webhook vai processar o pagamento e criar o agendamento quando receber a notificação do Mercado Pago
    // NÃO criamos agendamento aqui - apenas a preferência de pagamento

    // Return success response
    const response = {
      success: true,
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point
    };

    console.log('✅ Returning success response:', response);

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