// SUPABASE EDGE FUNCTION - NOTIFICATION WEBHOOK
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
  console.log('🚀 [WEBHOOK] Webhook recebido do Mercado Pago')
  console.log('📥 [WEBHOOK] Method:', req.method)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      console.log('⚠️ [WEBHOOK] Non-POST request, returning 200')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    const body = await req.json()
    console.log('📋 [WEBHOOK] Body:', body)

    // Verificar se é uma notificação válida
    if (!body || (!body.topic && !body.type)) {
      console.log('⚠️ [WEBHOOK] Notificação inválida - sem topic ou type')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar configurações do Mercado Pago (assumindo primeiro usuário por enquanto)
    const { data: adminSettings, error: settingsError } = await supabase
      .from('settings')
      .select('mercado_pago_access_token, user_id')
      .not('mercado_pago_access_token', 'is', null)
      .limit(1)
      .single()

    if (settingsError || !adminSettings?.mercado_pago_access_token) {
      console.error('❌ [WEBHOOK] Configurações do Mercado Pago não encontradas')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    console.log('✅ [WEBHOOK] Configurações encontradas para usuário:', adminSettings.user_id)

    let preferenceId = null
    let paymentStatus = null
    let externalReference = null

    // Processar notificação de merchant_order
    if (body.topic === 'merchant_order' && body.resource) {
      console.log('🛒 [WEBHOOK] Processando merchant_order:', body.resource)
      
      try {
        // Buscar detalhes da merchant_order
        const mpResponse = await fetch(body.resource, {
          headers: {
            'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (mpResponse.ok) {
          const merchantOrder = await mpResponse.json()
          console.log('🛒 [WEBHOOK] Merchant order details:', merchantOrder)
          
          preferenceId = merchantOrder.preference_id
          externalReference = merchantOrder.external_reference
          
          if (merchantOrder.payments && merchantOrder.payments.length > 0) {
            paymentStatus = merchantOrder.payments[0].status
            console.log('💳 [WEBHOOK] Payment status encontrado:', paymentStatus)
          }
        } else {
          console.error('❌ [WEBHOOK] Erro ao buscar merchant_order:', mpResponse.status)
        }
      } catch (error) {
        console.error('❌ [WEBHOOK] Erro ao buscar merchant_order:', error)
      }
      
    } else if (body.topic === 'payment' && body.resource) {
      console.log('💳 [WEBHOOK] Processando payment:', body.resource)
      
      try {
        // Extrair payment ID da URL
        const urlParts = body.resource.split('/')
        const paymentId = urlParts[urlParts.length - 1]
        
        // Buscar detalhes do pagamento
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (mpResponse.ok) {
          const payment = await mpResponse.json()
          console.log('💳 [WEBHOOK] Payment details:', payment)
          
          preferenceId = payment.preference_id
          paymentStatus = payment.status
          externalReference = payment.external_reference
        } else {
          console.error('❌ [WEBHOOK] Erro ao buscar payment:', mpResponse.status)
        }
      } catch (error) {
        console.error('❌ [WEBHOOK] Erro ao buscar payment:', error)
      }
    }

    if (!preferenceId) {
      console.log('⚠️ [WEBHOOK] Preference ID não encontrado')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    console.log('🔍 [WEBHOOK] Preference ID encontrado:', preferenceId)
    console.log('📊 [WEBHOOK] Payment status:', paymentStatus)
    console.log('🔗 [WEBHOOK] External reference:', externalReference)

    // Salvar notificação do webhook
    const { error: webhookError } = await supabase
      .from('webhook_notifications')
      .insert({
        payment_id: null,
        preference_id: preferenceId,
        owner_id: adminSettings.user_id,
        booking_id: externalReference,
        status: paymentStatus,
        raw_data: body,
        processed_at: new Date().toISOString()
      })

    if (webhookError) {
      console.error('❌ [WEBHOOK] Erro ao salvar webhook:', webhookError)
    }

    // Se o pagamento foi aprovado, criar/confirmar agendamento
    if (paymentStatus === 'approved' && preferenceId) {
      console.log('✅ [WEBHOOK] Pagamento aprovado, processando agendamento...')

      // Buscar dados do agendamento na tabela payments
      const { data: paymentDataList, error: paymentError } = await supabase
        .from('payments')
        .select('appointment_data, mercado_pago_preference_id')
        .eq('mercado_pago_preference_id', preferenceId)

      if (paymentError) {
        console.error('❌ [WEBHOOK] Erro ao buscar dados do agendamento:', paymentError)
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      if (!paymentDataList || paymentDataList.length === 0) {
        console.log('⚠️ [WEBHOOK] Nenhum dado de agendamento encontrado para preference_id:', preferenceId)
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      const paymentData = paymentDataList[0]
      console.log('📅 [WEBHOOK] Dados do agendamento encontrados:', paymentData.appointment_data)

      // Criar o agendamento
      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert({
          ...paymentData.appointment_data,
          status: 'confirmed',
          payment_status: 'approved',
          payment_data: { preference_id: preferenceId, status: paymentStatus },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ [WEBHOOK] Erro ao criar agendamento:', createError)
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      console.log('✅ [WEBHOOK] Agendamento criado com sucesso:', newAppointment.id)

      // Atualizar tabela payments
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'approved',
          mercado_pago_status: 'approved',
          mercado_pago_payment_id: null,
          appointment_id: newAppointment.id,
          updated_at: new Date().toISOString()
        })
        .eq('mercado_pago_preference_id', preferenceId)

      if (updateError) {
        console.error('❌ [WEBHOOK] Erro ao atualizar payment:', updateError)
      } else {
        console.log('✅ [WEBHOOK] Payment atualizado com sucesso')
      }

      // Atualizar payment_records
      const { error: recordError } = await supabase
        .from('payment_records')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('preference_id', preferenceId)

      if (recordError) {
        console.error('❌ [WEBHOOK] Erro ao atualizar payment_record:', recordError)
      } else {
        console.log('✅ [WEBHOOK] Payment record atualizado com sucesso')
      }
    }

    return new Response('ok', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro geral:', error)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
})