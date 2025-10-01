// SUPABASE EDGE FUNCTION - CRIAR PREFERÊNCIA DE PAGAMENTO
// -----------------------------------------------------------

export const config = { auth: false }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  console.log('💳 CREATE PAYMENT - Method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    // Obter o corpo da requisição
    let body
    try {
      body = await req.json()
      console.log('💳 Dados recebidos:', body)
    } catch (error) {
      console.log('⚠️ Erro ao parsear JSON')
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao parsear JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { 
      appointment_data, 
      amount, 
      currency = 'BRL',
      user_id,
      client_id 
    } = body

    if (!appointment_data || !amount || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados obrigatórios: appointment_data, amount, user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas')
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Gerar IDs únicos
    const bookingId = `apt_${Date.now()}_${user_id}`
    const externalReference = bookingId

    // Criar registro na tabela payments
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        amount: amount.toString(),
        currency,
        status: 'pending',
        mercado_pago_preference_id: null, // Será preenchido após criar a preferência
        appointment_data: {
          ...appointment_data,
          booking_id: bookingId,
          external_reference: externalReference
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Erro ao criar payment:', paymentError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar registro de pagamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Payment criado:', paymentData.id)

    // Criar preferência no Mercado Pago
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    if (!mpAccessToken) {
      console.error('❌ Token do Mercado Pago não configurado')
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do Mercado Pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // URL do webhook
    const webhookUrl = `${supabaseUrl}/functions/v1/webhook-payment`

    // Dados da preferência
    const preferenceData = {
      items: [
        {
          title: appointment_data.modality || 'Agendamento',
          quantity: 1,
          unit_price: parseFloat(amount),
          currency_id: currency
        }
      ],
      payer: {
        name: appointment_data.client_name || 'Cliente',
        email: appointment_data.client_email || 'cliente@exemplo.com'
      },
      external_reference: externalReference,
      notification_url: webhookUrl,
      back_urls: {
        success: `${appointment_data.return_url || 'https://app.arenatime.com.br'}/payment/success`,
        failure: `${appointment_data.return_url || 'https://app.arenatime.com.br'}/payment/failure`,
        pending: `${appointment_data.return_url || 'https://app.arenatime.com.br'}/payment/pending`
      },
      auto_return: 'approved',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
    }

    console.log('💳 Criando preferência no MP:', preferenceData)

    try {
      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferenceData)
      })

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text()
        console.error('❌ Erro ao criar preferência no MP:', mpResponse.status, errorText)
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao criar preferência no Mercado Pago' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const preference = await mpResponse.json()
      console.log('✅ Preferência criada no MP:', preference.id)

      // Atualizar payment com preference_id
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          mercado_pago_preference_id: preference.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.id)

      if (updateError) {
        console.error('❌ Erro ao atualizar payment:', updateError)
      }

      // Criar registro em payment_records
      const { error: recordError } = await supabase
        .from('payment_records')
        .insert({
          preference_id: preference.id,
          external_reference: externalReference,
          owner_id: user_id,
          status: 'pending_payment',
          amount: amount.toString(),
          currency,
          init_point: preference.init_point,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (recordError) {
        console.error('❌ Erro ao criar payment_record:', recordError)
      }

      // Resposta
      const response = {
        success: true,
        preference_id: preference.id,
        init_point: preference.init_point,
        external_reference: externalReference,
        booking_id: bookingId,
        amount: amount,
        currency,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }

      console.log('✅ Resposta:', response)

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (error) {
      console.error('❌ Erro ao criar preferência:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar preferência no Mercado Pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

