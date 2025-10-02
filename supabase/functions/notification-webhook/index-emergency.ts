import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('🚨 [WEBHOOK EMERGENCY] Processando com correção definitiva')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📨 [WEBHOOK EMERG] Body received:', JSON.stringify(body, null, 2))

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Den<｜Assistant｜>.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar configurações (qualquer admin)
    const { data: adminSettings } = await supabase
      .from('settings')
      .select('mercado_pago_access_token, user_id')
      .not('mercado_pago_access_token', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!adminSettings?.mercado_pago_access_token) {
      console.error('❌ [WEBHOOK EMERG] Configurações não encontradas')
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
          console.log('✅ [WEBHOOK EMERG] Payment status:', paymentStatus)
        }
      }
    }

    // Se pagamento foi aprovado, criar agendamento com cliente CORRETO
    if (paymentStatus === 'approved' && preferenceId) {
      console.log('✅ [WEBHOOK EMERG] Pagamento aprovado! Processando agendamento...')

      // Buscar dados do pagamento
      const { data: paymentDataList } = await supabase
        .from('payments')
        .select('appointment_data, mercado_pago_preference_id')
        .eq('mercado_pago_preference_id', preferenceId)

      if (!paymentDataList || paymentDataList.length === 0) {
        console.error('❌ [WEBHOOK EMERG] Dados do pagamento não encontrados')
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      const paymentData = paymentDataList[0]
      console.log('📊 [WEBHOOK EMERG] Payment data:', JSON.stringify(paymentData, null, 2))

      // CORREÇÃO DEFINITIVA: SEMPRE criar cliente baseado nos dados disponíveis
      let finalClientId = null
      
      if (paymentData.appointment_data?.client_data) {
        // Usar dados do client_data se disponível
        const clientData = paymentData.appointment_data.client_data
        
        console.log('✅ [WEBHOOK EMERG] Using client_data:', clientData)
        
        // Buscar ou criar cliente
        const { data: existingClient } = await supabase
          .from('booking_clients')
          .select('id, name, email')
          .ilike('email', clientData.email.toLowerCase().trim())
          .is('user_id', null)
          .maybeSingle()

        if (existingClient) {
          finalClientId = existingClient.id
          console.log('✅ [WEBHOOK EMERG] Existing client found:', { 
            id: finalClientId, 
            name: existingClient.name 
          })
        } else {
          // Criar novo cliente
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
            finalClient的 = newClient.id
            console.log('✅ [WEBHOOK EMERG] New client created:', { 
              id: finalClientId, 
              email: clientData.email 
            })
          }
        }
      } else {
        // SEM client_data - criar cliente EMERGÊNCIA
        console.log('🚨 [WEBHOOK EMERG] NO client_data! Creating emergency client...')
        
        const emergencyEmail = `sem_email_${Date.now()}@emergencia.local`;
        const emergencyName = `Cliente Pagamento ${new Date().toLocaleTimeString()}`;
        
        const { data: emergencyClient } = await supabase
          .from('booking_clients')
          .insert({
            name: emergencyName,
            email: emergencyEmail,
            phone: '',
            password_hash: 'temp_hash',
            user_id: null
          })
          .select('id')
          .single();

        if (emergencyClient) {
          finalClientId = emergencyClient.id
          console.log('✅ [WEBHOOK EMERG] Emergency client created:', { 
            id: finalClientId, 
            name: emergencyName 
          })
        }
      }

      if (!finalClientId) {
        console.error('❌ [WEBHOOK EMERG] Failed to determine client ID')
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
        console.log('⚠️ [WEBHOOK EMERG] Appointment exists, updating with correct client...')
        
        // Atualizar agendamento existente com cliente CORRETO
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            client_id: finalClientId, // CLAVE: cliente correto!
            status: 'pago',
            payment_status: 'approved',
            payment_data: { preference_id: preferenceId, status: paymentStatus },
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAppointment.id)

        if (updateError) {
          console.error('❌ [WEBHOOK EMERG] Error updating appointment:', updateError)
        } else {
          console.log('✅ [WEBHOOK EMERG] Appointment updated with CORRECT client!')
        }
      } else {
        console.log('✅ [WEBHOOK EMERG] Creating new appointment with CORRECT client...')
        
        // Criar novo agendamento com cliente CORRETO
        const appointmentId = crypto.randomUUID()
        
        const { data: newAppointment } = await supabase
          .from('appointments')
          .insert({
            id: appointmentId,
            user_id: paymentData.appointment_data.user_id,
            client_id: finalClientId, // CLAVE: cliente correto!
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
          console.log('✅ [WEBHOOK EMERG] NEW appointment created with CORRECT client!', newAppointment.id)
        }
      }

      // Atualizar outras tabelas
      await supabase
        .from('payments')
        .update({
          status: 'approved',
          marketplace_pago_status: 'approved',
          mercado_pago_ payment_id: body.id || null,
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

      console.log('✅ [WEBHOOK EMERG] Payment processing completed!')
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
    
  } catch (error) {
    console.error('❌ [WEBHOOK EMERG] Error:', error)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
})
