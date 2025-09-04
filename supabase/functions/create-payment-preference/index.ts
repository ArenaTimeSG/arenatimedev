import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePaymentRequest {
  appointment_id?: string;
  user_id?: string;
  amount: number;
  description: string;
  modality_name: string;
  client_name: string;
  client_email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar se é POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Obter dados da requisição
    const requestBody = await req.json()
    console.log('📥 Dados recebidos:', requestBody)
    
    const { appointment_id, user_id, amount, description, modality_name, client_name, client_email }: CreatePaymentRequest = requestBody

    // Validar dados obrigatórios
    console.log('🔍 Validando dados:', {
      appointment_id: !!appointment_id,
      user_id: !!user_id,
      amount: amount,
      description: !!description,
      client_name: !!client_name,
      client_email: !!client_email
    })

    if ((!appointment_id && !user_id) || !amount || !description || !client_name || !client_email) {
      console.error('❌ Dados obrigatórios não fornecidos:', {
        appointment_id,
        user_id,
        amount,
        description,
        client_name,
        client_email
      })
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Obter variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas')
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Determinar o user_id
    let targetUserId: string;
    
    if (appointment_id) {
      // Se temos appointment_id, buscar o user_id do agendamento
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('user_id')
        .eq('id', appointment_id)
        .single()

      if (appointmentError || !appointmentData) {
        console.error('❌ Erro ao buscar agendamento:', appointmentError)
        return new Response(
          JSON.stringify({ error: 'Agendamento não encontrado' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      targetUserId = appointmentData.user_id;
    } else if (user_id) {
      // Se temos user_id diretamente, usar ele
      targetUserId = user_id;
    } else {
      return new Response(
        JSON.stringify({ error: 'ID do usuário não fornecido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar configurações do Mercado Pago do usuário
    console.log('🔍 Buscando configurações para user_id:', targetUserId)
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('mercado_pago_access_token, mercado_pago_enabled')
      .eq('user_id', targetUserId)
      .single()

    console.log('🔍 Resultado da busca de configurações:', { settingsData, settingsError })

    if (settingsError || !settingsData) {
      console.error('❌ Erro ao buscar configurações:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Configurações do Mercado Pago não encontradas' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Verificando configuração do Mercado Pago:', {
      mercado_pago_enabled: settingsData.mercado_pago_enabled,
      has_access_token: !!settingsData.mercado_pago_access_token
    })

    if (!settingsData.mercado_pago_enabled || !settingsData.mercado_pago_access_token) {
      console.error('❌ Mercado Pago não configurado para este usuário:', {
        mercado_pago_enabled: settingsData.mercado_pago_enabled,
        has_access_token: !!settingsData.mercado_pago_access_token
      })
      return new Response(
        JSON.stringify({ error: 'Mercado Pago não está configurado para esta quadra' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const mercadoPagoAccessToken = settingsData.mercado_pago_access_token

    // Criar preferência no Mercado Pago
    const preferenceData = {
      items: [
        {
          title: `${modality_name} - ${description}`,
          description: `Agendamento para ${client_name}`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: client_name,
        email: client_email
      },
      back_urls: {
        success: `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/payment/success`,
        failure: `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/payment/failure`,
        pending: `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: appointment_id || `temp_${Date.now()}`,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-webhook`
    }

    console.log('💳 Criando preferência no Mercado Pago:', preferenceData)

    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    })

    if (!mercadoPagoResponse.ok) {
      const errorText = await mercadoPagoResponse.text()
      console.error('❌ Erro ao criar preferência no Mercado Pago:', errorText)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar preferência de pagamento' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const preference = await mercadoPagoResponse.json()
    console.log('✅ Preferência criada:', preference.id)

    // Salvar informações do pagamento no banco (apenas se temos appointment_id)
    let paymentData = null;
    if (appointment_id) {
      const { data: paymentResult, error: paymentError } = await supabase
        .from('payments')
        .insert({
          appointment_id,
          amount,
          currency: 'BRL',
          status: 'pending',
          mercado_pago_id: preference.id,
          payment_method: 'mercado_pago'
        })
        .select()
        .single()

      if (paymentError) {
        console.error('❌ Erro ao salvar pagamento no banco:', paymentError)
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar informações do pagamento' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      paymentData = paymentResult;

      // Atualizar status do agendamento
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ payment_status: 'pending' })
        .eq('id', appointment_id)

      if (appointmentError) {
        console.error('❌ Erro ao atualizar agendamento:', appointmentError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentData?.id || null,
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        external_reference: preferenceData.external_reference
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro na função:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
