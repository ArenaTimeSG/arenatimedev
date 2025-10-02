import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('🚨 [WEBHOOK DYNAMIC] Processando com correção DINÂMICA')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📨 [WEBHOOK DYNAMIC] Body received:', JSON.stringify(body, null, 2))

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar configurações (qualquer admin)
    const { data: adminSettings } = await supabase
      .from('settings')
      .select('mercado_pago_access_token, user_id')
      .not('mercado_pago_access_token', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!adminSettings?.mercado_pago_access_token) {
      console.error('❌ [WEBHOOK DYNAMIC] Configurações não encontradas')
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    // Processar notificação
    let paymentStatus = null
    let preferenceId = null

    if (body.topic === 'merchant_order' && body.resource) {
      const mpResponse = await fetch(body.resource, {
        headers: {
          'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (mpResponse.ok) {
        const merchantOrder = await mpResponse.json()
        preferenceId = merchantOrder.preference_id
        
        if (merchantOrder.payments && merchantOrder.payments.length > 0) {
          paymentStatus = merchantOrder.payments[0].status
          console.log('✅ [WEBHOOK DYNAMIC] Payment status:', paymentStatus)
        }
      }
    }

    // Se pagamento foi aprovado, criar agendamento com cliente CORRETO
    if (paymentStatus === 'approved' && preferenceId) {
      console.log('✅ [WEBHOOK DYNAMIC] Pagamento aprovado! Processando agendamento...')

      // Buscar dados do pagamento
      const { data: paymentDataList } = await supabase
        .from('payments')
        .select('appointment_data, mercado_pago_preference_id')
        .eq('mercado_pago_preference_id', preferenceId)

      if (!paymentDataList || paymentDataList.length === 0) {
        console.error('❌ [WEBHOOK DYNAMIC] Dados do pagamento não encontrados')
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      const paymentData = paymentDataList[0]
      console.log('📊 [WEBHOOK DYNAMIC] Payment data:', JSON.stringify(paymentData, null, 2))

      // CORREÇÃO DEFINITIVA: NUNCA usar cliente aleatório - SEMPRE criar ou buscar cliente correto
      let finalClientId = null
      
      console.log('🔍 [WEBHOOK FINAL] === BUSCA INTELIGENTE DE CLIENTE ===')
      console.log('🔍 [WEBHOOK FINAL] paymentData.appointment_data.client_data:', paymentData.appointment_data?.client_data)
      
      // ESTRATÉGIA CORRETA: Primeiro verificar client_data, depois fazer fallback inteligente
      if (paymentData.appointment_data?.client_data) {
        console.log('✅ [WEBHOOK FINAL] Client_data found:', paymentData.appointment_data.client_data)
        
        const clientData = paymentData.appointment_data.client_data
        
        // Buscar cliente existente por email (global ou específico do admin)
        console.log('🔍 [WEBHOOK FINAL] Searching for existing client by email:', clientData.email)
        
        const { data: existingClient } = await supabase
          .from('booking_clients')
          .select('id, name, email, user_id')
          .ilike('email', clientData.email.toLowerCase().trim())
          .maybeSingle()

        if (existingClient) {
          finalClientId = existingClient.id
          console.log('✅ [WEBHOOK FINAL] Found existing client:', { 
            id: finalClientId, 
            name: existingClient.name,
            email: existingClient.email 
          })
        } else {
          // Criar novo cliente com dados do formulário
          console.log('🔍 [WEBHOOK FINAL] Creating new client with form data')
          const { data: newClient } = await supabase
            .from('booking_clients')
            .insert({
              name: clientData.name,
              email: clientData.email,
              phone: clientData.phone || '',
              password_hash: 'temp_hash',
              user_id: null
            })
            .select('id')
            .single()

          if (newClient) {
            finalClientId = newClient.id
            console.log('✅ [WEBHOOK FINAL] Created new client:', { 
              id: finalClientId, 
              name: clientData.name,
              email: clientData.email 
            })
          }
        }
      } else {
        console.log('❌ [WEBHOOK FINAL] NO client_data - usando fallback inteligente')
        
        // FALLBACK INTELIGENTE: Criar cliente único baseado no timestamp de pagamento
        const timestamp = new Date().toLocaleString('pt-BR')
        const uniqueEmail = `cliente_pagamento_${Date.now()}@automatico.local`;
        const uniqueName = `Cliente Pagamento ${timestamp}`;
        
        console.log('🔧 [WEBHOOK FINAL] Creating unique client with data:', { name: uniqueName, email: uniqueEmail })
        
        const { data: uniqueClient } = await supabase
          .from('booking_clients')
          .insert({
            name: uniqueName,
            email: uniqueEmail,
            phone: '',
            password_hash: 'temp_hash',
            user_id: null
          })
          .select('id')
          .single();

        if (uniqueClient) {
          finalClientId = uniqueClient.id
          console.log('✅ [WEBHOOK FINAL] Unique client created:', { 
            id: finalClientId, 
            name: uniqueName,
            email: uniqueEmail 
          })
        }
      }

      if (!finalClientId) {
        console.error('❌ [WEBHOOK DYNAMIC] Failed to determine client ID')
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      // Verificar se agendamento já existe
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('id, status, client_id')
        .eq('user_id', paymentData.appointment_data.user_id)
        .eq('date', paymentData.appointment_data.date)
        .maybeSingle()

      if (existingAppointment) {
        console.log('⚠️ [WEBHOOK DYNAMIC] Appointment exists, updating with correct client...')
        
        // Atualizar agendamento existente com cliente correto
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            client_id: finalClientId, // Cliente correto!
            status: 'pago',
            payment_status: 'approved',
            payment_data: { preference_id: preferenceId, status: paymentStatus },
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAppointment.id)

        if (updateError) {
          console.error('❌ [WEBHOOK DYNAMIC] Error updating appointment:', updateError)
        } else {
          console.log('✅ [WEBHOOK DYNAMIC] Appointment updated with correct client!')
        }
      } else {
        console.log('✅ [WEBHOOK DYNAMIC] Creating new appointment with correct client...')
        
        // Crear nuevo agendamento com cliente correcto
        const appointmentId = crypto.randomUUID()
        
        const { data: newAppointment } = await supabase
          .from('appointments')
          .insert({
            id: appointmentId,
            user_id: paymentData.appointment_data.user_id,
            client_id: finalClientId, // Cliente correcto!
            date: paymentData.appointment_data.date,
            modality_id: paymentData.appointment_data.modality_id,
            modality: paymentData.appointment_data.modality,
            valor_total: paymentData.appointment_data.valor_total,
            status: 'pago',
            payment_status: 'approved',
            payment_data: { preference_id: preferenceId, status: paymentStatus },
            booking_source: 'online',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (newAppointment) {
          console.log('✅ [WEBHOOK DYNAMIC] NEW appointment created with correct client!', newAppointment.id)
        }
      }

      // Atualizar outras tabelas
      await supabase
        .from('payments')
        .update({
          status: 'approved',
          marketplace_pago_status: 'approved',
          marketplace_pago_payment_id: body.id || null,
          appointment_id: existingAppointment?.id || newAppointment?.id,
          updated_at: new Date().toISOString()
        })
        .eq('mercado_pago_preference_id', preferenceId)

      await supabase
        .from('payment_records')
        .update({
          status: 'confirmed',
          booking_id: existingAppointment?.id || newAppointment?.id,
          updated_at: new Date().toISOString()
        })
        .eq('preference_id', preferenceId)

      console.log('✅ [WEBHOOK DYNAMIC] Payment processing completed!')
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
    
  } catch (error) {
    console.error('❌ [WEBHOOK DYNAMIC] Error:', error)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
})
