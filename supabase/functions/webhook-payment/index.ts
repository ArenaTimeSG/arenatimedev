// SUPABASE EDGE FUNCTION - WEBHOOK PAGAMENTO
// -----------------------------------------------------------

export const config = { auth: false }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  console.log('🔔 WEBHOOK PAGAMENTO - Method:', req.method)
  
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
      console.log('🔔 Dados recebidos:', JSON.stringify(body, null, 2))
    } catch (error) {
      console.log('⚠️ Erro ao parsear JSON')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    // Verificar se é uma notificação de pagamento
    if (body.type === 'payment' && body.data && body.data.id) {
      const paymentId = body.data.id
      console.log('💳 Processando pagamento:', paymentId)

      // Criar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Variáveis de ambiente não configuradas')
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Buscar detalhes do pagamento no Mercado Pago
      const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      if (!mpAccessToken) {
        console.error('❌ Token do Mercado Pago não configurado')
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      try {
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!mpResponse.ok) {
          console.error('❌ Erro ao buscar pagamento no MP:', mpResponse.status)
          return new Response('ok', { status: 200, headers: corsHeaders })
        }

        const payment = await mpResponse.json()
        console.log('💳 Pagamento encontrado:', payment.status, payment.external_reference)

        // Salvar notificação do webhook
        const { error: webhookError } = await supabase
          .from('webhook_notifications')
          .insert({
            payment_id: paymentId,
            status: payment.status,
            raw_data: payment,
            processed_at: new Date().toISOString()
          })

        if (webhookError) {
          console.error('❌ Erro ao salvar webhook:', webhookError)
        }

        // Se o pagamento foi aprovado, criar/confirmar agendamento
        if (payment.status === 'approved' && payment.external_reference) {
          console.log('✅ Pagamento aprovado, processando agendamento...')

          // Buscar dados do agendamento na tabela payments
          const { data: paymentData, error: paymentError } = await supabase
            .from('payments')
            .select('appointment_data')
            .eq('mercado_pago_preference_id', payment.external_reference)
            .single()

          if (paymentError || !paymentData) {
            console.error('❌ Erro ao buscar dados do agendamento:', paymentError)
            return new Response('ok', { status: 200, headers: corsHeaders })
          }

          console.log('📅 Dados do agendamento encontrados:', paymentData.appointment_data)

          // Criar o agendamento
          const { data: newAppointment, error: createError } = await supabase
            .from('appointments')
            .insert({
              ...paymentData.appointment_data,
              status: 'confirmed',
              payment_status: 'approved',
              payment_data: payment,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (createError) {
            console.error('❌ Erro ao criar agendamento:', createError)
            return new Response('ok', { status: 200, headers: corsHeaders })
          }

          console.log('✅ Agendamento criado com sucesso:', newAppointment.id)

          // Atualizar tabela payments
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              status: 'approved',
              mercado_pago_status: 'approved',
              mercado_pago_payment_id: paymentId,
              appointment_id: newAppointment.id,
              updated_at: new Date().toISOString()
            })
            .eq('mercado_pago_preference_id', payment.external_reference)

          if (updateError) {
            console.error('❌ Erro ao atualizar payment:', updateError)
          } else {
            console.log('✅ Payment atualizado com sucesso')
          }

          // Atualizar payment_records
          const { error: recordError } = await supabase
            .from('payment_records')
            .update({
              status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('preference_id', payment.external_reference)

          if (recordError) {
            console.error('❌ Erro ao atualizar payment_record:', recordError)
          } else {
            console.log('✅ Payment record atualizado com sucesso')
          }

        } else {
          console.log('⚠️ Pagamento não aprovado ou sem external_reference:', payment.status)
        }

      } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error)
      }
    } else {
      console.log('⚠️ Notificação não é de pagamento')
    }

    return new Response('ok', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})