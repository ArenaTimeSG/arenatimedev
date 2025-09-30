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

    let paymentId = body?.data?.id
    let paymentData = null

    // Se não é uma notificação direta de pagamento, tentar processar merchant_order
    if (!paymentId && body.topic === 'merchant_order' && body.resource) {
      console.log('🔍 [WEBHOOK] Processando merchant_order:', body.resource)
      
      try {
        // Buscar configurações do admin para obter access token
        const adminUserId = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f' // Fallback
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        const { data: adminSettings } = await supabase
          .from('settings')
          .select('mercado_pago_access_token')
          .eq('user_id', adminUserId)
          .single()

        if (adminSettings?.mercado_pago_access_token) {
          // Buscar detalhes do merchant_order
          const mpResponse = await fetch(body.resource, {
            headers: {
              'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (mpResponse.ok) {
            const merchantOrder = await mpResponse.json()
            console.log('💳 [WEBHOOK] Merchant order details:', merchantOrder)
            
            if (merchantOrder.payments && merchantOrder.payments.length > 0) {
              paymentId = merchantOrder.payments[0].id
              console.log('💳 [WEBHOOK] Payment ID encontrado:', paymentId)
              
              // Buscar detalhes do pagamento
              const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                  'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (paymentResponse.ok) {
                paymentData = await paymentResponse.json()
                console.log('💳 [WEBHOOK] Payment details:', paymentData)
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ [WEBHOOK] Erro ao processar merchant_order:', error)
      }
    }

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
    let preferenceId = payment?.preference_id || body?.data?.preference_id
    
    // Se não encontrou preference_id, tentar buscar no external_reference
    if (!preferenceId && payment?.external_reference) {
      console.log('🔍 [WEBHOOK] Buscando preference_id pelo external_reference:', payment.external_reference)
      
      // Buscar payment_record pelo external_reference para obter preference_id
      const { data: recordByRef } = await supabase
        .from('payment_records')
        .select('preference_id')
        .eq('external_reference', payment.external_reference)
        .single()
      
      if (recordByRef) {
        preferenceId = recordByRef.preference_id
        console.log('✅ [WEBHOOK] Preference ID encontrado pelo external_reference:', preferenceId)
      }
    }
    
    let paymentRecord = null
    let ownerId = null

    console.log('🔍 [WEBHOOK] Preference ID final:', preferenceId)

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
        console.log('✅ [WEBHOOK] Registro de pagamento encontrado:', record.id)
      }
    } else {
      // Se não tem preference_id, tentar buscar pelo external_reference
      const externalRef = payment?.external_reference
      console.log('🔍 [WEBHOOK] External reference:', externalRef)
      
      if (externalRef) {
        // Primeiro tentar buscar pelo external_reference exato
        let { data: record, error: recordError } = await supabase
          .from('payment_records')
          .select('*')
          .eq('external_reference', externalRef)
          .single()

        if (recordError) {
          console.log('⚠️ [WEBHOOK] Registro não encontrado pelo external_reference exato, tentando buscar pelo padrão...')
          
          // Se não encontrou, buscar pelo padrão apt_timestamp_userid
          if (externalRef.startsWith('apt_')) {
            const parts = externalRef.split('_')
            if (parts.length >= 3) {
              const userId = parts[2]
              console.log('🔍 [WEBHOOK] Buscando por user_id:', userId)
              
              // Buscar o registro mais recente para este usuário
              const { data: recentRecord } = await supabase
                .from('payment_records')
                .select('*')
                .eq('owner_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
              
              if (recentRecord) {
                record = recentRecord
                recordError = null
                console.log('✅ [WEBHOOK] Registro encontrado pelo user_id:', record.id)
              }
            }
          }
        }

        if (recordError) {
          console.error('❌ [WEBHOOK] Erro ao buscar registro por external_reference:', recordError)
        } else if (record) {
          paymentRecord = record
          ownerId = record.owner_id
          console.log('✅ [WEBHOOK] Registro de pagamento encontrado:', record.id)
        }
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

    // Buscar detalhes do pagamento (se não foi obtido do merchant_order)
    let payment: MercadoPagoPayment
    if (paymentData) {
      payment = paymentData
      console.log('💳 [WEBHOOK] Usando dados do pagamento do merchant_order')
    } else {
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

      payment = await mpResponse.json()
    }
    
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
      console.log('✅ [WEBHOOK] Pagamento aprovado - Criando/confirmando agendamento')
      
      // Se não encontrou payment_record, tentar criar um automaticamente
      if (!paymentRecord) {
        console.log('⚠️ [WEBHOOK] Registro de pagamento não encontrado, criando automaticamente...')
        
        const externalRef = payment.external_reference
        if (externalRef && externalRef.startsWith('apt_')) {
          // Extrair user_id do external_reference
          const parts = externalRef.split('_')
          if (parts.length >= 3) {
            const userId = parts[2]
            
            // Criar payment_record automaticamente
            const { data: newPaymentRecord, error: createRecordError } = await supabase
              .from('payment_records')
              .insert({
                booking_id: null,
                owner_id: userId,
                preference_id: payment.preference_id || `auto_${paymentId}`,
                init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${payment.preference_id || paymentId}`,
                external_reference: externalRef,
                amount: payment.transaction_amount,
                currency: payment.currency_id,
                status: 'approved',
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
              })
              .select()
              .single()
            
            if (createRecordError) {
              console.error('❌ [WEBHOOK] Erro ao criar payment_record:', createRecordError)
            } else {
              paymentRecord = newPaymentRecord
              ownerId = userId
              console.log('✅ [WEBHOOK] Payment_record criado automaticamente:', paymentRecord.id)
            }
          }
        }
        
        if (!paymentRecord) {
          console.error('❌ [WEBHOOK] Não foi possível criar payment_record')
        return new Response(
          JSON.stringify({ success: false, message: 'Registro de pagamento não encontrado' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      }

      let bookingId = paymentRecord.booking_id
      let booking = null

      // Se não há booking_id, criar novo agendamento
      if (!bookingId) {
        console.log('🔍 [WEBHOOK] Criando novo agendamento a partir dos dados do pagamento')
        
        // Buscar dados do agendamento na tabela payments pela preferência
        const { data: paymentData } = await supabase
          .from('payments')
          .select('appointment_data')
          .eq('mercado_pago_preference_id', payment.preference_id)
          .single()
        
        if (paymentData && paymentData.appointment_data) {
          // Criar o agendamento com os dados armazenados
          const { data: newAppointment, error: createError } = await supabase
            .from('appointments')
            .insert({
              ...paymentData.appointment_data,
              status: 'approved',
              payment_status: 'approved',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (createError || !newAppointment) {
            console.error('❌ [WEBHOOK] Erro ao criar agendamento:', createError)
            return new Response(
              JSON.stringify({ success: false, message: 'Erro ao criar agendamento' }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
          
          bookingId = newAppointment.id
          booking = newAppointment
          console.log('✅ [WEBHOOK] Agendamento criado com sucesso:', bookingId)
          
          // Atualizar o registro de pagamento com o ID do agendamento
          await supabase
            .from('payment_records')
            .update({ 
              booking_id: bookingId,
              status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('preference_id', payment.preference_id)
        } else {
          console.log('⚠️ [WEBHOOK] Dados do agendamento não encontrados na tabela payments, tentando criar com dados básicos')
          
          // Buscar dados do cliente pelo external_reference
          const externalRef = payment.external_reference || paymentRecord?.external_reference
          console.log('🔍 [WEBHOOK] External reference:', externalRef)
          
          if (externalRef && externalRef.startsWith('apt_')) {
            // Extrair dados do external_reference: apt_timestamp_userid
            const parts = externalRef.split('_')
            if (parts.length >= 3) {
              const timestamp = parts[1]
              const userId = parts[2]
              
              // Buscar dados do cliente mais recente para este usuário
              const { data: recentClient } = await supabase
                .from('booking_clients')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
              
              if (recentClient) {
                // Buscar modalidade padrão
                const { data: defaultModality } = await supabase
                  .from('modalities')
                  .select('*')
                  .eq('user_id', userId)
                  .limit(1)
                  .single()
                
                // Criar agendamento com dados básicos
                const appointmentData = {
                  user_id: userId,
                  client_id: recentClient.id,
                  date: new Date().toISOString(), // Usar data atual como fallback
                  modality: defaultModality?.name || 'Agendamento Online',
                  modality_id: defaultModality?.id || null,
                  valor_total: payment.transaction_amount,
                  payment_status: 'approved',
                  status: 'approved',
                  booking_source: 'online',
                  name: recentClient.name,
                  email: recentClient.email
                }
                
                console.log('🔍 [WEBHOOK] Criando agendamento com dados básicos:', appointmentData)
                
                const { data: newAppointment, error: createError } = await supabase
                  .from('appointments')
                  .insert(appointmentData)
                  .select()
                  .single()
                
                if (createError || !newAppointment) {
                  console.error('❌ [WEBHOOK] Erro ao criar agendamento básico:', createError)
                  return new Response(
                    JSON.stringify({ success: false, message: 'Erro ao criar agendamento básico' }),
                    { 
                      status: 500, 
                      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                    }
                  )
                }
                
                bookingId = newAppointment.id
                booking = newAppointment
                console.log('✅ [WEBHOOK] Agendamento básico criado com sucesso:', bookingId)
                
                // Atualizar o registro de pagamento com o ID do agendamento
                await supabase
                  .from('payment_records')
                  .update({ 
                    booking_id: bookingId,
                    status: 'approved',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', paymentRecord.id)
              } else {
                console.error('❌ [WEBHOOK] Cliente não encontrado para external_reference:', externalRef)
                return new Response(
                  JSON.stringify({ success: false, message: 'Cliente não encontrado' }),
                  { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                  }
                )
              }
            } else {
              console.error('❌ [WEBHOOK] External reference inválido:', externalRef)
              return new Response(
                JSON.stringify({ success: false, message: 'External reference inválido' }),
                { 
                  status: 400, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }
          } else {
            console.error('❌ [WEBHOOK] External reference não encontrado')
            return new Response(
              JSON.stringify({ success: false, message: 'External reference não encontrado' }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        }
      } else {
        // Se há booking_id, confirmar agendamento existente
        const { data: existingBooking } = await supabase
        .from('appointments')
        .select('*')
          .eq('id', bookingId)
        .single()

        if (!existingBooking) {
        console.error('❌ [WEBHOOK] Agendamento não encontrado')
        return new Response(
          JSON.stringify({ success: false, message: 'Agendamento não encontrado' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

        booking = existingBooking

      // Verificar se já existe outro agendamento no mesmo horário
      const { data: conflictingBooking } = await supabase
        .from('appointments')
        .select('id')
        .eq('user_id', booking.user_id)
        .eq('date', booking.date)
        .eq('status', 'confirmed')
          .neq('id', bookingId)
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
            .eq('booking_id', bookingId)

        await supabase
          .from('appointments')
          .update({ 
            status: 'conflict_payment',
            payment_data: payment,
            updated_at: new Date().toISOString()
          })
            .eq('id', bookingId)

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Conflito de horário - pagamento não pode ser confirmado',
            data: {
                booking_id: bookingId,
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

        // Confirmar o agendamento existente
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'approved',
          payment_status: 'approved',
          payment_data: payment,
          updated_at: new Date().toISOString()
        })
          .eq('id', bookingId)

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
          status: 'approved',
          updated_at: new Date().toISOString()
        })
          .eq('booking_id', bookingId)

        console.log('✅ [WEBHOOK] Agendamento confirmado com sucesso:', bookingId)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Pagamento aprovado e agendamento confirmado',
          data: {
            booking_id: bookingId,
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
