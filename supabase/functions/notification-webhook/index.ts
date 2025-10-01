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

    // Obter o corpo da requisição
    let body
    try {
      body = await req.json()
      console.log('📥 [WEBHOOK] Body:', JSON.stringify(body, null, 2))
    } catch (error) {
      console.log('⚠️ [WEBHOOK] Erro ao parsear JSON, retornando 200')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    // Verificar se é uma notificação de pagamento
    if (body.type !== 'payment' || !body.data?.id) {
      console.log('⚠️ [WEBHOOK] Notificação não é de pagamento ou dados inválidos')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    const paymentId = body.data.id
    console.log('💳 [WEBHOOK] Processando pagamento ID:', paymentId)

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [WEBHOOK] Variáveis de ambiente não configuradas')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar configurações do admin (usar o primeiro admin encontrado)
    const { data: adminSettings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('mercado_pago_enabled', true)
      .not('mercado_pago_access_token', 'is', null)
      .single()

    if (settingsError || !adminSettings) {
      console.error('❌ [WEBHOOK] Configurações do Mercado Pago não encontradas')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    console.log('✅ [WEBHOOK] Configurações encontradas para usuário:', adminSettings.user_id)

    // Buscar detalhes do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mpResponse.ok) {
      console.error('❌ [WEBHOOK] Erro ao buscar pagamento no MP:', mpResponse.status)
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    const payment = await mpResponse.json()
    console.log('💳 [WEBHOOK] Pagamento encontrado:', payment.status, payment.external_reference)

    // Salvar notificação do webhook (com campos obrigatórios)
    const { error: webhookError } = await supabase
      .from('webhook_notifications')
      .insert({
        payment_id: paymentId,
        preference_id: payment.preference_id || null,
        owner_id: adminSettings.user_id,
        booking_id: null,
        status: payment.status,
        raw_data: payment,
        processed_at: new Date().toISOString()
      })

    if (webhookError) {
      console.error('❌ [WEBHOOK] Erro ao salvar webhook:', webhookError)
    }

    // Se o pagamento foi aprovado, criar/confirmar agendamento
    if (payment.status === 'approved' && payment.external_reference) {
      console.log('✅ [WEBHOOK] Pagamento aprovado, processando agendamento...')

      // Buscar dados do agendamento na tabela payments (sem .single() para evitar erro PGRST116)
      const { data: paymentDataList, error: paymentError } = await supabase
        .from('payments')
        .select('appointment_data')
        .eq('mercado_pago_preference_id', payment.preference_id)

      if (paymentError) {
        console.error('❌ [WEBHOOK] Erro ao buscar dados do agendamento:', paymentError)
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      if (!paymentDataList || paymentDataList.length === 0) {
        console.log('⚠️ [WEBHOOK] Nenhum dado de agendamento encontrado para preference_id:', payment.preference_id)
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
          payment_data: payment,
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
          mercado_pago_payment_id: paymentId,
          appointment_id: newAppointment.id,
          updated_at: new Date().toISOString()
        })
        .eq('mercado_pago_preference_id', payment.preference_id)

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
        .eq('preference_id', payment.preference_id)

      if (recordError) {
        console.error('❌ [WEBHOOK] Erro ao atualizar payment_record:', recordError)
      } else {
        console.log('✅ [WEBHOOK] Payment record atualizado com sucesso')
      }

    } else {
      console.log('⚠️ [WEBHOOK] Pagamento não aprovado ou sem external_reference:', payment.status)
    }

    // Sempre retornar 200 OK para o Mercado Pago
    return new Response('ok', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro interno:', error)
    // Sempre retornar 200 OK mesmo em caso de erro
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
})