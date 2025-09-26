// SUPABASE EDGE FUNCTION - NOTIFICATION WEBHOOK
// -----------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface WebhookNotification {
  type: string
  data: {
    id: string
    preference_id?: string
  }
}

interface MercadoPagoPayment {
  id: string
  status: string
  status_detail: string
  transaction_amount: number
  currency_id: string
  payment_method_id: string
  payment_type_id: string
  external_reference: string
  preference_id: string
  date_approved?: string
  date_created: string
  date_last_updated: string
  payer: {
    email: string
    identification: {
      type: string
      number: string
    }
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 [WEBHOOK] Webhook recebido do Mercado Pago')
    console.log('📥 [WEBHOOK] Method:', req.method)
    console.log('📥 [WEBHOOK] Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2))

    const body = await req.json()
    console.log('📥 [WEBHOOK] Body:', JSON.stringify(body, null, 2))

    const paymentId = body?.data?.id
    if (!paymentId) {
      console.error('❌ [WEBHOOK] Payment ID não encontrado')
      return new Response(
        JSON.stringify({ success: false, message: 'Payment ID não encontrado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('💳 [WEBHOOK] Processando pagamento ID:', paymentId)

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Identificar o dono da preferência
    const preferenceId = body?.data?.preference_id
    let paymentRecord = null
    let ownerId = null

    if (preferenceId) {
      const { data: record, error: recordError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('preference_id', preferenceId)
        .single()

      if (recordError) {
        console.error('❌ [WEBHOOK] Erro ao buscar registro de pagamento:', recordError)
      } else {
        paymentRecord = record
        ownerId = record.owner_id
      }
    }

    if (!ownerId) {
      console.error('❌ [WEBHOOK] Owner não encontrado')
      return new Response(
        JSON.stringify({ success: false, message: 'Owner não encontrado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar configurações do admin na tabela settings
    const { data: adminSettings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', ownerId)
      .single()

    if (settingsError || !adminSettings || !adminSettings.mercado_pago_access_token) {
      console.error('❌ [WEBHOOK] Configurações do Mercado Pago não encontradas')
      return new Response(
        JSON.stringify({ success: false, message: 'Configurações do Mercado Pago não encontradas' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se já foi processado (idempotência)
    const { data: existingNotification } = await supabase
      .from('webhook_notifications')
      .select('*')
      .eq('payment_id', paymentId)
      .single()

    if (existingNotification) {
      console.log('ℹ️ [WEBHOOK] Notificação já processada:', paymentId)
      return new Response(
        JSON.stringify({ success: true, message: 'Notificação já processada' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar assinatura (opcional - log apenas se inválida)
    const signature = req.headers.get('x-signature')
    if (signature && adminSettings.mercado_pago_webhook_url) {
      const payload = JSON.stringify(body)
      // Nota: A validação de assinatura do Mercado Pago é mais complexa
      // Por enquanto, apenas logamos se a assinatura estiver presente
      console.log('🔐 [WEBHOOK] Assinatura recebida:', signature)
    }

    // Buscar detalhes do pagamento
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 
        'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mpResponse.ok) {
      console.error('❌ [WEBHOOK] Erro ao buscar detalhes do pagamento:', mpResponse.status)
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao buscar detalhes do pagamento' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const payment: MercadoPagoPayment = await mpResponse.json()
    console.log('💳 [WEBHOOK] Detalhes do pagamento:', JSON.stringify(payment, null, 2))

    // Salvar notificação
    await supabase
      .from('webhook_notifications')
      .insert({
        payment_id: paymentId,
        preference_id: preferenceId,
        owner_id: ownerId,
        booking_id: paymentRecord?.booking_id,
        status: payment.status,
        raw_data: payment,
        processed_at: new Date().toISOString()
      })

    // Processar baseado no status
    if (payment.status === 'approved') {
      console.log('✅ [WEBHOOK] Pagamento aprovado - Confirmando agendamento')
      
      if (!paymentRecord) {
        console.error('❌ [WEBHOOK] Registro de pagamento não encontrado')
        return new Response(
          JSON.stringify({ success: false, message: 'Registro de pagamento não encontrado' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Verificar se o horário ainda está disponível
      const { data: booking } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', paymentRecord.booking_id)
        .single()

      if (!booking) {
        console.error('❌ [WEBHOOK] Agendamento não encontrado')
        return new Response(
          JSON.stringify({ success: false, message: 'Agendamento não encontrado' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Verificar se já existe outro agendamento no mesmo horário
      const { data: conflictingBooking } = await supabase
        .from('appointments')
        .select('id')
        .eq('user_id', booking.user_id)
        .eq('date', booking.date)
        .eq('status', 'confirmed')
        .neq('id', paymentRecord.booking_id)
        .single()

      if (conflictingBooking) {
        console.warn('⚠️ [WEBHOOK] Conflito de horário detectado')
        
        // Atualizar status para conflict_payment
        await supabase
          .from('payment_records')
          .update({ 
            status: 'conflict_payment',
            updated_at: new Date().toISOString()
          })
          .eq('booking_id', paymentRecord.booking_id)

        await supabase
          .from('appointments')
          .update({ 
            status: 'conflict_payment',
            payment_data: payment,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.booking_id)

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Conflito de horário - pagamento não pode ser confirmado',
            data: {
              booking_id: paymentRecord.booking_id,
              payment_id: paymentId,
              status: 'conflict_payment'
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Confirmar o agendamento
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          payment_status: 'approved',
          payment_data: payment,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.booking_id)

      if (updateError) {
        console.error('❌ [WEBHOOK] Erro ao confirmar agendamento:', updateError)
        return new Response(
          JSON.stringify({ success: false, message: 'Erro ao confirmar agendamento' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Atualizar status do registro de pagamento
      await supabase
        .from('payment_records')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', paymentRecord.booking_id)

      console.log('✅ [WEBHOOK] Agendamento confirmado com sucesso:', paymentRecord.booking_id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Pagamento aprovado e agendamento confirmado',
          data: {
            booking_id: paymentRecord.booking_id,
            payment_id: paymentId,
            status: 'approved'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } else {
      console.log(`ℹ️ [WEBHOOK] Status do pagamento: ${payment.status}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Pagamento com status: ${payment.status}`,
          data: {
            payment_id: paymentId,
            status: payment.status
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro ao processar webhook:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
