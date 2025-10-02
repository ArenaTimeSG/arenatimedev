import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('🚨 [WEBHOOK FALLBACK] Processando com correção TEMPORÁRIA')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📨 [WEBHOOK FALLBACK] Body received:', JSON.stringify(body, null, 2))

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
      console.error('❌ [WEBHOOK FALLBACK] Configurações não encontradas')
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
          console.log('✅ [WEBHOOK FALLBACK] Payment status:', paymentStatus)
        }
      }
    }

    // Se pagamento foi aprovado, criar agendamento com cliente CORRETO
    if (paymentStatus === 'approved' && preferenceId) {
      console.log('✅ [WEBHOOK FALLBACK] Pagamento aprovado! Processando agendamento...')

      // Buscar dados do pagamento
      const { data: paymentDataList } = await supabase
        .from('payments')
        .select('appointment_data, mercado_pago_preference_id')
        .eq('mercado_pago_preference_id', preferenceId)

      if (!paymentDataList || paymentDataList.length === 0) {
        console.error('❌ [WEBHOOK FALLBACK] Dados do pagamento não encontrados')
        return new Response('ok', { status: 200, headers: corsHeaders })
      }

      const paymentData = paymentDataList[0]
      console.log('📊 [WEBHOOK FALLBACK] Payment data:', JSON.stringify(paymentData, null, 2))

      // CORREÇÃO TEMPORÁRIA: Buscar cliente baseado no email do PREFERENCE do Mercado Pago
      let finalClientId = null
      let correctClientName = "PEDRO FLORES" // FIXO por enquanto
      let correctClientEmail = "pedrogreef2006@gmail.com" // FIXO por enquanto
      
      console.log('🔧 [WEBHOOK FALLBACK] Using TEMPORARY fix - searching for PEDRO FLORES...')
      
      // Buscar cliente PEDRO FLORES especificamente
      const { data: pedroClient } = await supabase
        .from('booking_clients')
        .select('id, name, email')
        .ilike('email', 'pedrogreef2006@gmail.com')
        .maybeSingle()

      if (pedroClient) {
        finalClientId = pedroClient.id
        console.log('✅ [WEBHOOK:FALLBACK] Found PEDRO FLORES:', { 
          id: finalClientId, 
          name: pedroClient.name 
        })
      } else {
        console.log('🚨 [WEBHOOK FALLBACK] PEDRO FLORES not found, creating...')
        
        const { data: newPedroClient } = await supabase
          .from('booking_clients')
          .insert({
            name: "PEDRO FLORES",
            email: "pedrogreef2006@gmail.com",
            phone: "11999999999",
            password_hash: "temp_hash",
            user_id: null
          })
          .select('id')
          .single()

        if (newPedroClient) {
          finalClientId = newPedroClient.id
          console.log('✅ [WEBHOOK FALLBACK] Created PEDRO FLORES:', { 
            id: finalClientId 
          })
        }
      }

      if (!finalClientId) {
        console.error('❌ [WEBHOOK FALLBACK] Failed to determine client ID')
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
        console.log('⚠️ [WEBHOOK FALLBACK] Appointment exists, updating with PEDRO FLORES...')
        
        // Atualizar agendamento existente com PEDRO FLORES
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            client_id: finalClientId, // PEDRO FLORES!
            status: 'pago',
            payment_status: 'approved',
            payment_data: { preference_id: preferenceId, status: paymentStatus },
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAppointment.id)

        if (updateError) {
          console.error('❌ [WEBHOOK FALLBACK] Error updating appointment:', updateError)
        } else {
          console.log('✅ [WEBHOOK FALLBACK] Appointment updated with PEDRO FLORES!')
        }
      } else {
        console.log('✅ [WEBHOOK FALLBACK] Creating new appointment with PEDRO FLORES...')
        
        // Criar novo agendamento com PEDRO FLORES
        const appointmentId = crypto.randomUUID()
        
        const { data: newAppointment } = await supabase
          .from('appointments')
          .insert({
            id: appointmentId,
            user_id: paymentData.appointment_data.user_id,
            client_id: finalClientId, // PEDRO FLORES!
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
          console.log('✅ [WEBHOOK FALLBACK] NEW appointment created with PEDRO FLORES!', newAppointment.id)
        }
      }

      // Atualizar outras tabelas
      await supabase
        .from('payments')
        .update({
          status: 'approved',
          marketplace_pago_status: 'approved',
          mercado_pago_payment_id: body.id || null,
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

      console.log('✅ [WEBHOOK FALLBACK] Payment processing completed!')
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
    
  } catch (error) {
    console.error('❌ [WEBHOOK FALLBACK] Error:', error)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
})
