// SUPABASE EDGE FUNCTION - VERIFICAR STATUS DO PAGAMENTO
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
  console.log('🔍 CHECK PAYMENT - Method:', req.method)
  
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
      console.log('🔍 Dados recebidos:', body)
    } catch (error) {
      console.log('⚠️ Erro ao parsear JSON')
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao parsear JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { preference_id } = body

    if (!preference_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'preference_id é obrigatório' }),
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

    // Buscar registro de pagamento
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_records')
      .select('*')
      .eq('preference_id', preference_id)
      .single()

    if (paymentError || !paymentRecord) {
      console.log('⚠️ Payment record não encontrado:', paymentError)
      return new Response(
        JSON.stringify({ success: false, error: 'Pagamento não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('💳 Payment record encontrado:', paymentRecord.status)

    // Buscar dados do agendamento se existir
    let appointmentData = null
    if (paymentRecord.external_reference) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', paymentRecord.external_reference)
        .single()

      if (!appointmentError && appointment) {
        appointmentData = appointment
        console.log('📅 Agendamento encontrado:', appointment.status)
      }
    }

    // Determinar status do pagamento
    let paymentStatus = paymentRecord.status
    let mercadoPagoStatus = paymentRecord.status

    // Se o status for pending_payment, verificar no Mercado Pago
    if (paymentRecord.status === 'pending_payment') {
      const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      if (mpAccessToken) {
        try {
          // Buscar preferência no Mercado Pago
          const mpResponse = await fetch(`https://api.mercadopago.com/checkout/preferences/${preference_id}`, {
            headers: {
              'Authorization': `Bearer ${mpAccessToken}`,
              'Content-Type': 'application/json'
            }
          })

          if (mpResponse.ok) {
            const preference = await mpResponse.json()
            console.log('💳 Preferência encontrada no MP:', preference.status)
            
            // Se há pagamentos associados, verificar o status
            if (preference.payment_id) {
              const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${preference.payment_id}`, {
                headers: {
                  'Authorization': `Bearer ${mpAccessToken}`,
                  'Content-Type': 'application/json'
                }
              })

              if (paymentResponse.ok) {
                const payment = await paymentResponse.json()
                paymentStatus = payment.status
                mercadoPagoStatus = payment.status
                console.log('💳 Status do pagamento no MP:', payment.status)
              }
            }
          }
        } catch (error) {
          console.error('❌ Erro ao verificar status no MP:', error)
        }
      }
    }

    // Resposta
    const response = {
      success: true,
      preference_id: paymentRecord.preference_id,
      payment_status: paymentStatus,
      mercado_pago_status: mercadoPagoStatus,
      booking_id: paymentRecord.external_reference,
      appointment: appointmentData,
      created_at: paymentRecord.created_at,
      updated_at: paymentRecord.updated_at,
      // Flag para indicar se o agendamento foi confirmado
      is_confirmed: paymentStatus === 'approved' && appointmentData && appointmentData.status === 'confirmed',
      // Status do agendamento para o frontend
      appointment_status: appointmentData ? appointmentData.status : 'pending'
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

