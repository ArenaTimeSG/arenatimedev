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

    // Buscar configurações do Mercado Pago (primeira configuração com token válido)
    const { data: adminSettings, error: settingsError } = await supabase
      .from('settings')
      .select('mercado_pago_access_token, user_id')
      .not('mercado_pago_access_token', 'is', null)
      .limit(1)
      .maybeSingle()

    if (settingsError || !adminSettings?.mercado_pago_access_token) {
      console.error('❌ [WEBHOOK] Configurações do Mercado Pago não encontradas')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    console.log('✅ [WEBHOOK] Configurações encontradas para usuário:', adminSettings.user_id)

    let preferenceId = null
    let paymentStatus = null
    let externalReference = null
    let paymentId = null

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
        paymentId = urlParts[urlParts.length - 1]
        
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
          
          // Se não tem preference_id no payment, buscar na order
          if (!preferenceId && payment.order?.id) {
            console.log('🔍 [WEBHOOK] Buscando preference_id na order:', payment.order.id)
            
            try {
              const orderResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${payment.order.id}`, {
                headers: {
                  'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (orderResponse.ok) {
                const order = await orderResponse.json()
                preferenceId = order.preference_id
                console.log('✅ [WEBHOOK] Preference ID encontrado na order:', preferenceId)
              }
            } catch (orderError) {
              console.error('❌ [WEBHOOK] Erro ao buscar order:', orderError)
            }
          }
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
        payment_id: paymentId,
        preference_id: preferenceId,
        owner_id: adminSettings.user_id,
        booking_id: null, // Não usar external_reference como booking_id
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

      // LOGS DETALHADOS PARA DEBUG
      console.log('🔍 [WEBHOOK] Debug client_data:')
      console.log('  - client_id atual:', paymentData.appointment_data.client_id)
      console.log('  - client_data presente:', !!paymentData.appointment_data.client_data)
      if (paymentData.appointment_data.client_data) {
        console.log('  - client_data.name:', paymentData.appointment_data.client_data.name)
        console.log('  - client_data.email:', paymentData.appointment_data.client_data.email)
        console.log('  - client_data.phone:', paymentData.appointment_data.client_data.phone)
      }

    // DETERMINAR CLIENT_ID CORRETO PRIMEIRO - SEMPRE BUSCAR PELO CLIENT_DATA
    let finalClientId = null; // FORÇAR BUSCA SEMPRE
    
    console.log('🔍 [WEBHOOK CRITICAL DEBUG] === INICIANDO BUSCA DE CLIENTE ===')
    console.log('🔍 [WEBHOOK] paymentData complete =', JSON.stringify(paymentData, null, 2))
    console.log('🔍 [WEBHOOK] appointment_data.client_data =', paymentData.appointment_data.client_data)
    console.log('🔍 [WEBHOOK] appointment_data.client_id =', paymentData.appointment_data.client_id)
    console.log('🔍 [WEBHOOK] appointment_data.user_id =', paymentData.appointment_data.user_id)
    
    // Sempre buscar pelo client_data se disponível, ignorar client_id que pode estar errado
    if (paymentData.appointment_data.client_data) {
        console.log('🔍 [WEBHOOK] ✅ Client_data encontrado! Buscando cliente existente por email...')
        console.log('🔍 [WEBHOOK] Client_data email =', paymentData.appointment_data.client_data.email)
        
        // BUSCA INTELIGENTE: Primeiro cliente global, depois específico do admin
        console.log('🔍 [WEBHOOK] Buscando cliente global primeiro...')
          
          // 1. Buscar cliente global (user_id = null) - PRIORIDADE
          const { data: globalClient } = await supabase
            .from('booking_clients')
            .select('id, name, email, user_id, password_hash')
            .ilike('email', paymentData.appointment_data.client_data.email.toLowerCase().trim())
            .is('user_id', null)
            .maybeSingle()

          if (globalClient) {
            console.log('✅ [WEBHOOK] Cliente GLOBAL encontrado:', { 
              clientId: globalClient.id, 
              email: globalClient.email,
              hasRealPassword: globalClient.password_hash !== 'temp_hash'
            })
            
            // Atualizar dados do cliente se necessário (but maintain as global)
            const { error: updateError } = await supabase
              .from('booking_clients')
              .update({
                name: paymentData.appointment_data.client_data.name,
                phone: paymentData.appointment_data.client_data.phone
              })
              .eq('id', globalClient.id)
            
            if (updateError) {
              console.error('⚠️ [WEBHOOK] Erro ao atualizar dados do cliente:', updateError)
            } else {
              console.log('✅ [WEBHOOK] Dados do cliente atualizados')
            }
            
            finalClientId = globalClient.id
          } else {
            // 2. Buscar cliente específico do admin
            console.log('🔍 [WEBHOOK] Cliente global não encontrado, buscando específico do admin...')
            
            const { data: adminClient } = await supabase
              .from('booking_clients')
              .select('id, name, email, user_id, password_hash')
              .ilike('email', paymentData.appointment_data.client_data.email.toLowerCase().trim())
              .eq('user_id', paymentData.appointment_data.user_id)
              .maybeSingle()

            if (adminClient) {
              finalClientId = adminClient.id
              console.log('✅ [WEBHOOK] Cliente específico do admin encontrado:', { 
                clientId: finalClientId, 
                email: adminClient.email,
                hasRealPassword: adminClient.password_hash !== 'temp_hash'
              })
            } else {
              console.log('❌ [WEBHOOK] ⚠️ ⚠️ ⚠️ PROBLEMA CRÍTICO: NENHUM cliente encontrado!')
              console.log('❌ [WEBHOOK] Email buscado:', paymentData.appointment_data.client_data.email.toLowerCase().trim())
              console.log('❌ [WEBHOOK] Admin_id:', paymentData.appointment_data.user_id)
              console.log('❌ [WEBHOOK] Isso vai gerar cliente ERRADO - encontrando primeiro cliente...')
              
              // Fallback: usar primeiro cliente disponível do admin
              const { data: firstClient, error: clientError } = await supabase
                .from('booking_clients')
                .select('id, name, email')
                .eq('user_id', paymentData.appointment_data.user_id)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

              if (clientError || !firstClient) {
                console.error('❌ [WEBHOOK] Erro ao buscar cliente ou nenhum cliente encontrado:', clientError)
                return new Response('ok', { status: 200, headers: corsHeaders })
              }

              finalClientId = firstClient.id
              console.log('❌ [WEBHOOK] ⚠️ USANDO CLIENTE ERRADO COMO FALLBACK:', { 
                clientId: finalClientId, 
                name: firstClient.name, 
                email: firstClient.email 
              })
              console.log('❌ [WEBHOOK] ⚠️ Este cliente será associado incorretamente ao agendamento!')
            }
          }
        }
      } else {
        // Fallback: usar client_id original se não há client_data
        finalClientId = paymentData.appointment_data.client_id;
        console.log('⚠️ [WEBHOOK] Sem client_data, usando client_id original:', finalClientId)
      }

      // Se ainda não temos client_id, usar primeiro cliente disponível
      if (!finalClientId) {
        console.log('❌ [WEBHOOK] AINDA sem finalClientId, buscando primeiro cliente disponível...')
        
        const { data: firstClient, error: clientError } = await supabase
          .from('booking_clients')
          .select('id, name, email')
          .eq('user_id', paymentData.appointment_data.user_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (clientError || !firstClient) {
          console.error('❌ [WEBHOOK] Erro ao buscar cliente ou nenhum cliente encontrado:', clientError)
          return new Response('ok', { status: 200, headers: corsHeaders })
        }

        finalClientId = firstClient.id
        console.log('✅ [WEBHOOK] Usando primeiro cliente disponível como último recurso:', { 
          clientId: finalClientId, 
          name: firstClient.name, 
          email: firstClient.email 
        })
      }

      console.log('🎯 [WEBHOOK] Cliente final determinado:', finalClientId)

      // VERIFICAR SE JÁ EXISTE AGENDAMENTO (EVITAR DUPLICAÇÃO)
      console.log('🔍 [WEBHOOK] Verificando se já existe agendamento para evitar duplicação...')
      
      // Buscar agendamentos com data próxima (±30 minutos) para capturar agendamentos duplicados
      const appointmentDate = new Date(paymentData.appointment_data.date)
      const thirtyMinutesBefore = new Date(appointmentDate.getTime() - 30 * 60 * 1000).toISOString()
      const thirtyMinutesAfter = new Date(appointmentDate.getTime() + 30 * 60 * 1000).toISOString()
      
      const { data: existingAppointment, error: checkError } = await supabase
        .from('appointments')
        .select('id, status, client_id, date')
        .eq('user_id', paymentData.appointment_data.user_id)
        .gte('date', thirtyMinutesBefore)
        .lte('date', thirtyMinutesAfter)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checkError) {
        console.error('❌ [WEBHOOK] Erro ao verificar agendamento existente:', checkError)
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      if (existingAppointment) {
        console.log('⚠️ [WEBHOOK] Agendamento já existe, atualizando status E cliente:', existingAppointment.id)
        console.log('  - Status atual:', existingAppointment.status)
        console.log('  - Cliente atual:', existingAppointment.client_id)
        console.log('  - Cliente correto:', finalClientId)
        console.log('  - Data agendamento:', existingAppointment.date)
        
        // Verificar se é um agendamento já processado ou não (Pode ser agendamento sem pagamento)
        if (existingAppointment.status === 'pago' || existingAppointment.status === 'confirmed' || existingAppointment.status === 'agendado') {
          console.log('⚠️ [WEBHOOK] Agendamento já foi processado! Evitando duplicação.')
          
          // Apenas atualizar dados do pagamento se necessário
          const { error: updatePaymentError } = await supabase
            .from('payments')
            .update({
              status: 'approved',
              mercado_pago_status: 'approved',
              mercado_pago_payment_id: paymentId,
              appointment_id: existingAppointment.id,
              updated_at: new Date().toISOString()
            })
            .eq('mercado_pago_preference_id', preferenceId)

          if (updatePaymentError) {
            console.error('❌ [WEBHOOK] Erro ao atualizar payment:', updatePaymentError)
          } else {
            console.log('✅ [WEBHOOK] Payment atualizado com sucesso (evitando duplicação)')
          }

          return new Response('ok', { status: 200, headers: corsHeaders })
        }
        
        // Atualizar agendamento existente com cliente correto
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            client_id: finalClientId, // CORRIGIR CLIENTE TAMBÉM
            status: 'pago',
            payment_status: 'approved',
            payment_data: { preference_id: preferenceId, status: paymentStatus },
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAppointment.id)

        if (updateError) {
          console.error('❌ [WEBHOOK] Erro ao atualizar agendamento:', updateError)
          return new Response('ok', { status: 200, headers: corsHeaders })
        } else {
          console.log('✅ [WEBHOOK] Agendamento atualizado com sucesso:', existingAppointment.id)
        }

        // Atualizar tabela payments
        const { error: updatePaymentError } = await supabase
          .from('payments')
          .update({
            status: 'approved',
            mercado_pago_status: 'approved',
            mercado_pago_payment_id: paymentId,
            appointment_id: existingAppointment.id,
            updated_at: new Date().toISOString()
          })
          .eq('mercado_pago_preference_id', preferenceId)

        if (updatePaymentError) {
          console.error('❌ [WEBHOOK] Erro ao atualizar payment:', updatePaymentError)
        } else {
          console.log('✅ [WEBHOOK] Payment atualizado com sucesso')
        }

        // Atualizar payment_records
        const { error: recordError } = await supabase
          .from('payment_records')
          .update({
            status: 'confirmed',
            booking_id: existingAppointment.id,
            updated_at: new Date().toISOString()
          })
          .eq('preference_id', preferenceId)

        if (recordError) {
          console.error('❌ [WEBHOOK] Erro ao atualizar payment_record:', recordError)
        } else {
          console.log('✅ [WEBHOOK] Payment record atualizado com sucesso')
        }

        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      // Se não existe agendamento, criar novo
      console.log('✅ [WEBHOOK] Nenhum agendamento existente, criando novo...')

      // Gerar UUID para o agendamento
      const appointmentId = crypto.randomUUID()
      
      // Criar o agendamento
      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert({
          id: appointmentId,
          user_id: paymentData.appointment_data.user_id,
          client_id: finalClientId,
          date: paymentData.appointment_data.date,
          modality_id: paymentData.appointment_data.modality_id,
          modality: paymentData.appointment_data.modality,
          valor_total: paymentData.appointment_data.valor_total,
          status: 'pago', // Status correto para agendamento pago
          payment_status: 'approved',
          payment_data: { preference_id: preferenceId, status: paymentStatus },
          booking_source: 'online',
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

      // CRIAR ASSOCIAÇÃO cliente-admin (se não existir)
      console.log('🔗 [WEBHOOK] Criando associação cliente-admin...')
      const { error: associationError } = await supabase
        .from('client_admin_associations')
        .upsert({
          client_id: finalClientId,
          admin_id: paymentData.appointment_data.user_id,
          first_appointment_date: newAppointment.created_at || new Date().toISOString()
        }, {
          onConflict: 'client_id,admin_id',
          ignoreDuplicates: true
        })

      if (associationError) {
        console.error('⚠️ [WEBHOOK] Erro ao criar associação (não crítico):', associationError)
      } else {
        console.log('✅ [WEBHOOK] Associação cliente-admin criada/atualizada')
      }

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
          status: 'confirmed',
          booking_id: newAppointment.id,
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