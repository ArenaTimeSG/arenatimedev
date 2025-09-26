// SUPABASE EDGE FUNCTION - CREATE PAYMENT PREFERENCE
// -----------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreatePreferenceRequest {
  owner_id: string
  booking_id: string
  price: number
  items?: Array<{
    title: string
    quantity: number
    unit_price: number
  }>
  return_url?: string
  client_id?: string
  appointment_date?: string
  modality_id?: string
}

interface CreatePreferenceResponse {
  success: boolean
  preference_id: string
  init_point: string
  error?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 [CREATE-PREFERENCE] Iniciando criação de preferência')
    
    const { owner_id, booking_id, price, items, return_url, client_id, appointment_date, modality_id }: CreatePreferenceRequest = await req.json()

    // Validar campos obrigatórios
    if (!owner_id || !booking_id || !price) {
      console.error('❌ [CREATE-PREFERENCE] Campos obrigatórios ausentes')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos obrigatórios: owner_id, booking_id, price'
        } as CreatePreferenceResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar configurações do admin (incluindo chaves do Mercado Pago)
    console.log('🔑 [CREATE-PREFERENCE] Buscando configurações do admin:', owner_id)
    const { data: adminSettings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', owner_id)
      .single()

    if (settingsError || !adminSettings) {
      console.error('❌ [CREATE-PREFERENCE] Configurações do admin não encontradas:', settingsError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configurações do admin não encontradas'
        } as CreatePreferenceResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se Mercado Pago está habilitado e configurado
    const isEnabled = adminSettings.mercado_pago_enabled
    const accessToken = adminSettings.mercado_pago_access_token
    const publicKey = adminSettings.mercado_pago_public_key

    if (!isEnabled || !accessToken || !publicKey) {
      console.error('❌ [CREATE-PREFERENCE] Mercado Pago não configurado corretamente')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Mercado Pago não está habilitado ou configurado corretamente'
        } as CreatePreferenceResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [CREATE-PREFERENCE] Mercado Pago configurado:', { isEnabled, hasToken: !!accessToken, hasPublicKey: !!publicKey })

    // Verificar se o agendamento existe, se não existir, criar um temporário
    console.log('🔍 [CREATE-PREFERENCE] Verificando se agendamento existe:', booking_id)
    let { data: booking, error: bookingError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      console.log('⚠️ [CREATE-PREFERENCE] Agendamento não encontrado, criando temporário...')
      
      // Criar agendamento temporário com status pending_payment
      const { data: newBooking, error: createError } = await supabase
        .from('appointments')
        .insert({
          id: booking_id,
          user_id: owner_id,
          client_id: client_id || '00000000-0000-0000-0000-000000000000', // UUID temporário
          date: appointment_date || new Date().toISOString(),
          status: 'pending_payment',
          modality_id: modality_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ [CREATE-PREFERENCE] Erro ao criar agendamento temporário:', createError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Erro ao criar agendamento temporário'
          } as CreatePreferenceResponse),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      booking = newBooking
      console.log('✅ [CREATE-PREFERENCE] Agendamento temporário criado:', booking.id)
    } else {
      console.log('✅ [CREATE-PREFERENCE] Agendamento encontrado:', booking.id)
    }

    // Criar preferência do Mercado Pago
    console.log('💳 [CREATE-PREFERENCE] Criando preferência no Mercado Pago...')
    
    const baseUrl = Deno.env.get('SUPABASE_URL') || 'https://xjsovawofsibcolnrgxl.supabase.co'
    
    const preference = {
      items: items || [{ 
        title: 'Agendamento', 
        quantity: 1, 
        unit_price: parseFloat(price.toString()) 
      }],
      external_reference: booking_id,
      back_urls: { 
        success: return_url || `${baseUrl}/payment/success`, 
        failure: return_url || `${baseUrl}/payment/failure`, 
        pending: return_url || `${baseUrl}/payment/pending` 
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/functions/v1/notification-webhook`,
      metadata: { owner_id, booking_id }
    }

    console.log('💳 [CREATE-PREFERENCE] Dados da preferência:', JSON.stringify(preference, null, 2))

    // Chamar API do Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text()
      console.error('❌ [CREATE-PREFERENCE] Erro na API do MP:', errorData)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao criar preferência no Mercado Pago'
        } as CreatePreferenceResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const preferenceData = await mpResponse.json()

    console.log('✅ [CREATE-PREFERENCE] Preferência criada com sucesso!')
    console.log('🆔 [CREATE-PREFERENCE] Preference ID:', preferenceData.id)

    // Criar registro de pagamento no banco
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_records')
      .insert({
        booking_id,
        owner_id,
        preference_id: preferenceData.id,
        init_point: preferenceData.init_point,
        external_reference: booking_id,
        amount: parseFloat(price.toString()),
        currency: 'BRL',
        status: 'pending_payment',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
      })
      .select()
      .single()

    if (paymentError) {
      console.error('❌ [CREATE-PREFERENCE] Erro ao criar registro de pagamento:', paymentError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao criar registro de pagamento'
        } as CreatePreferenceResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Atualizar agendamento com status pending_payment
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'pending_payment',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)

    if (updateError) {
      console.error('⚠️ [CREATE-PREFERENCE] Erro ao atualizar agendamento:', updateError)
    } else {
      console.log('✅ [CREATE-PREFERENCE] Agendamento atualizado com status pending_payment')
    }

    const responseData: CreatePreferenceResponse = {
      success: true,
      preference_id: preferenceData.id,
      init_point: preferenceData.init_point
    }

    console.log('📤 [CREATE-PREFERENCE] Retornando resposta:', responseData)
    
    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [CREATE-PREFERENCE] Erro ao criar preferência:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor'
      } as CreatePreferenceResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})