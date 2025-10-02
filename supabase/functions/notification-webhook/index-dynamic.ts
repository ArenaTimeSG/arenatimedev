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

    if (body.topic === 'mercart_order' && body.resource) {
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

      // SOLUÇÃO DINÂMICA: Extrair informações do cliente de múltiplas fontes
      let finalClientId = null
      
      console.log('🔍 [WEBHOOK DYNAMIC] === BUSCA INTELIGENTE DE CLIENTE ===')
      
      // 1. Tentar usar client_data se disponível
      if (paymentData.appointment_data?.client_data) {
        console.log('✅ [WEBHOOK DYNAMIC] Client_data found:', paymentData.appointment_data.client_data)
        
        const clientData = paymentData.appointment_data.client_data
        
        // Buscar cliente existente por email
        const { data: existingClient } = await supabase
          .from('booking_clients')
          .select('id, name, email')
          .ilike('email', clientData.email.toLowerCase().trim())
          .maybeSingle()

        if (existingClient) {
          finalClientId = existingClient.id
          console.log('✅ [WEBHOOK DYNAMIC] Found existing client:', { 
            id: finalClientId, 
            name: existingClient.name,
            email: existingClient.email
          })
        } else {
          // Criar novo cliente com dados do formulário
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
            console.log('✅ [WEBHOOK DYNAMIC] Created new client:', { 
              id: finalClientId, 
              name: clientData.name,
              email: clientData.email 
            })
          }
        }
      } else {
        console.log('❌ [WEBHOOK DYNAMIC] NO client_data available')
        
        // 2. Fallback: Tentar extrair informações do preference_id ou other metadata
        console.log('🔍 [WEBHOOK DYNAMIC] Attempting fallback extraction...')
        
        // Se não há client_data, criar cliente genérico baseado nas informações disponíveis
        const emergencyEmail = `sem_email_cliente_${Date.now()}@pagamento.local`;
        const emergencyName = `Cliente Pagamento ${new Date().toLocaleTimeString()}`;
        
        console.log('🚨 [WEBHOOK DYNAMIC] Creating emergency client...')
        
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
          console.log('✅ [WEBHOOK DYNAMIC] Emergency client created:', { 
            id: finalClientId, 
            name: emergencyName 
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
