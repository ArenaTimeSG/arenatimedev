export const config = { auth: false };

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
  booking_id?: string; // ID do agendamento que será pago (opcional)
  appointment_id?: string;
  appointment_data?: {
    user_id: string;
    client_id: string;
    date: string;
    modality: string;
    valor_total: number;
    payment_status: string;
    status: string;
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

    const { user_id, amount, description, client_name, client_email, booking_id, appointment_id, appointment_data: rawAppointmentData } = body
    
    // Parse appointment_data se for string
    let appointment_data = rawAppointmentData;
    if (typeof rawAppointmentData === 'string') {
      try {
        appointment_data = JSON.parse(rawAppointmentData);
        console.log('✅ Parsed appointment_data from string');
      } catch (error) {
        console.error('❌ Error parsing appointment_data:', error);
        appointment_data = null;
      }
    }

    // Validate required fields - mais flexível
    console.log('🔍 Validating fields:', { 
      user_id: !!user_id, 
      amount: !!amount, 
      description: !!description, 
      client_name: !!client_name, 
      client_email: !!client_email, 
      booking_id: !!booking_id,
      appointment_id: !!appointment_id,
      appointment_data: !!appointment_data
    });
    
    console.log('🔍 Field values:', { 
      user_id, 
      amount, 
      description, 
      client_name, 
      client_email, 
      booking_id,
      appointment_id,
      appointment_data
    });

    // Validação simplificada - apenas campos básicos obrigatórios
    if (!user_id || !amount || !description || !client_name || !client_email) {
      console.error('❌ Missing basic required fields:', { 
        user_id: !!user_id, 
        amount: !!amount, 
        description: !!description, 
        client_name: !!client_name, 
        client_email: !!client_email
      });
      return new Response(
        JSON.stringify({ error: 'Missing basic required fields', details: { 
          user_id: !!user_id, 
          amount: !!amount, 
          description: !!description, 
          client_name: !!client_name, 
          client_email: !!client_email
        }}),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('✅ Basic validation passed, proceeding with payment creation');

    // Se appointment_data está presente, apenas logar (não validar rigorosamente)
    if (appointment_data) {
      console.log('🔍 Appointment data received:', {
        user_id: !!appointment_data.user_id,
        client_id: !!appointment_data.client_id,
        date: !!appointment_data.date,
        modality: !!appointment_data.modality,
        valor_total: !!appointment_data.valor_total,
        payment_status: !!appointment_data.payment_status,
        status: !!appointment_data.status
      });
      console.log('✅ Appointment data validation passed (lenient)');
    } else {
      console.log('⚠️ No appointment_data provided, using booking_id/appointment_id');
    }

    // Gerar ID único para referência do pagamento
    let referenceId = booking_id || appointment_id;
    if (!referenceId && appointment_data) {
      // Gerar ID único baseado em timestamp e dados do agendamento
      referenceId = `appointment_${Date.now()}_${appointment_data.client_id}`;
      console.log('✅ Generated reference ID:', referenceId);
    }
    console.log('✅ Using reference ID:', referenceId);

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
      .select('mercado_pago_access_token, mercado_pago_enabled, mercado_pago_public_key')
      .eq('user_id', user_id)
      .single()
    
    console.log('🔍 Settings query result:', { settings, settingsError });

    // Se não encontrar configurações, usar configurações de produção
    let accessToken = settings?.mercado_pago_access_token;
    let isEnabled = settings?.mercado_pago_enabled;
    
    if (settingsError || !settings) {
      console.log('⚠️ Settings not found, using production configuration from environment');
      // Usar token de produção das variáveis de ambiente
      accessToken = Deno.env.get('MP_ACCESS_TOKEN');
      isEnabled = true;
    }

    console.log('✅ Using configuration:', { enabled: isEnabled, hasToken: !!accessToken });

    if (!isEnabled || !accessToken) {
      console.error('❌ Mercado Pago not enabled or token missing');
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Mercado Pago preference
    const externalRef = referenceId; // Usar o referenceId (booking_id ou appointment_id) como external_reference
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
        success: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/payment/success`,
        failure: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/payment/failure`,
        pending: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/payment/pending`
      },
      external_reference: externalRef
    }

    console.log('💳 Creating Mercado Pago preference...', JSON.stringify(preferenceData, null, 2));

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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

    // Armazenar dados do pagamento para o webhook processar
    if (appointment_data) {
      console.log('💾 Armazenando dados do agendamento para webhook...');
      
      const { data: paymentRecord, error: paymentInsertError } = await supabase
        .from('payments')
        .insert({
          user_id: user_id,
          amount: amount,
          description: description,
          client_name: client_name,
          client_email: client_email,
          mercado_pago_preference_id: preference.id,
          external_reference: externalRef,
          appointment_data: appointment_data,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (paymentInsertError) {
        console.error('❌ Erro ao armazenar dados do pagamento:', paymentInsertError);
        // Não falhar aqui, apenas logar o erro
      } else {
        console.log('✅ Dados do pagamento armazenados:', paymentRecord.id);
      }
    }

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
    console.log('  - Has appointment_data:', !!appointment_data);
    
    // O webhook vai processar o pagamento e criar o agendamento quando receber a notificação do Mercado Pago
    // NÃO criamos agendamento aqui - apenas a preferência de pagamento

    // Return success response
    const response = {
      success: true,
      preference_id: preference.id,
      init_point: preference.init_point,
      // Usar apenas init_point de produção
      checkout_url: preference.init_point
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