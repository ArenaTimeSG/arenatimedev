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
  preference_id?: string
  init_point?: string
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

    // Validar campos obrigatórios com valores padrão
    if (!owner_id || !price) {
      console.error('❌ [CREATE-PREFERENCE] Campos obrigatórios ausentes')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos obrigatórios: owner_id, price'
        } as CreatePreferenceResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Gerar booking_id se não fornecido
    const finalBookingId = booking_id || `apt_${Date.now()}_${owner_id.substring(0, 8)}`
    console.log('🆔 [CREATE-PREFERENCE] Booking ID:', finalBookingId)

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('🔑 [CREATE-PREFERENCE] Supabase URL:', supabaseUrl)
    console.log('🔑 [CREATE-PREFERENCE] Service Key existe:', !!supabaseServiceKey)
    console.log('🔑 [CREATE-PREFERENCE] Service Key length:', supabaseServiceKey?.length)
    
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
    console.log('🔍 [CREATE-PREFERENCE] Verificando se agendamento existe:', finalBookingId)
    let { data: booking, error: bookingError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', finalBookingId)
      .single()

    if (bookingError || !booking) {
      console.log('⚠️ [CREATE-PREFERENCE] Agendamento não encontrado, criando temporário...')
      
      // Criar agendamento temporário com dados mínimos
      const { data: newBooking, error: createError } = await supabase
        .from('appointments')
        .insert({
          id: finalBookingId,
          user_id: owner_id,
          client_id: client_id || null,
          date: appointment_date || new Date().toISOString(),
          status: 'pending_payment',
          modality_id: modality_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ [CREATE-PREFERENCE] Erro ao criar agendamento temporário:', createError)
        // Continuar mesmo com erro na criação do agendamento
        booking = { id: finalBookingId, user_id: owner_id }
      } else {
        booking = newBooking
        console.log('✅ [CREATE-PREFERENCE] Agendamento temporário criado:', booking.id)
      }
    } else {
      console.log('✅ [CREATE-PREFERENCE] Agendamento encontrado:', booking.id)
    }

    // Criar preferência do Mercado Pago
    console.log('💳 [CREATE-PREFERENCE] Criando preferência no Mercado Pago...')
    
    const baseUrl = 'https://arenatime.vercel.app'; // HTTPS obrigatório desde maio 2025
    
    const preferenceData = {
      items: items || [{ 
        title: 'Agendamento', 
        quantity: 1, 
        unit_price: parseFloat(price.toString()) 
      }],
      external_reference: finalBookingId,
      back_urls: { 
        success: return_url || `${baseUrl}/payment/success`, 
        failure: return_url || `${baseUrl}/payment/failure`, 
        pending: return_url || `${baseUrl}/payment/pending` 
      },
      auto_return: 'approved',
      notification_url: `${supabaseUrl}/functions/v1/notification-webhook`,
      metadata: { owner_id, booking_id: finalBookingId }
    }

    console.log('💳 [CREATE-PREFERENCE] Dados da preferência:', JSON.stringify(preferenceData, null, 2))

    // Chamar API do Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
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

    const mpPreference = await mpResponse.json()

    console.log('✅ [CREATE-PREFERENCE] Preferência criada com sucesso!')
    console.log('🆔 [CREATE-PREFERENCE] Preference ID:', mpPreference.id)

    // Criar registro de pagamento no banco
    console.log('🔍 [CREATE-PREFERENCE] Criando payment_record com dados:', {
      booking_id: null,
      owner_id,
      preference_id: mpPreference.id,
      init_point: mpPreference.init_point,
      external_reference: finalBookingId,
      amount: parseFloat(price.toString()),
      currency: 'BRL',
      status: 'pending_payment'
    });

    console.log('🔍 [CREATE-PREFERENCE] Tentando inserir payment_record usando função SQL...')
    
    // Usar função SQL para garantir que o registro seja criado
    const { error: sqlError } = await supabase.rpc('create_payment_record_auto', {
      p_owner_id: owner_id,
      p_preference_id: mpPreference.id,
      p_init_point: mpPreference.init_point,
      p_external_reference: finalBookingId,
      p_amount: parseFloat(price.toString()),
      p_currency: 'BRL',
      p_status: 'pending_payment'
    })
    
    console.log('🔍 [CREATE-PREFERENCE] Resultado da função SQL:', { sqlError })
    
    // Buscar o registro criado
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_records')
      .select('*')
      .eq('preference_id', mpPreference.id)
      .single()
      
    console.log('🔍 [CREATE-PREFERENCE] Resultado da busca:', { paymentRecord, paymentError })

    if (sqlError) {
      console.error('❌ [CREATE-PREFERENCE] Erro na função SQL:', sqlError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao criar registro de pagamento: ${sqlError.message}`,
          details: sqlError
        } as CreatePreferenceResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (paymentError) {
      console.error('❌ [CREATE-PREFERENCE] Erro ao buscar registro de pagamento:', paymentError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao buscar registro de pagamento: ${paymentError.message}`,
          details: paymentError
        } as CreatePreferenceResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!paymentRecord) {
      console.error('❌ [CREATE-PREFERENCE] paymentRecord é null após criação!')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Registro de pagamento não foi criado corretamente'
        } as CreatePreferenceResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [CREATE-PREFERENCE] Registro de pagamento criado com sucesso:', paymentRecord.id)
    console.log('🔍 [CREATE-PREFERENCE] Dados do payment_record criado:', JSON.stringify(paymentRecord, null, 2))

    // Criar registro na tabela payments com dados do agendamento
    const { data: paymentData, error: paymentDataError } = await supabase
      .from('payments')
      .insert({
        appointment_id: null, // Será preenchido pelo webhook
        amount: parseFloat(price.toString()),
        currency: 'BRL',
        status: 'pending',
        mercado_pago_preference_id: mpPreference.id,
        appointment_data: {
          user_id: owner_id,
          client_id: client_id,
          date: appointment_date,
          modality: items?.[0]?.title || 'Agendamento',
          modality_id: modality_id,
          valor_total: parseFloat(price.toString()),
          payment_status: 'pending',
          status: 'a_cobrar',
          booking_source: 'online'
        }
      })
      .select()
      .single()

    if (paymentDataError) {
      console.error('❌ [CREATE-PREFERENCE] Erro ao criar dados do agendamento:', paymentDataError)
      console.error('❌ [CREATE-PREFERENCE] Detalhes do erro:', JSON.stringify(paymentDataError, null, 2))
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao salvar dados do agendamento'
        } as CreatePreferenceResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.log('✅ [CREATE-PREFERENCE] Dados do agendamento criados:', paymentData.id)
    }

    const responseData: CreatePreferenceResponse = {
      success: true,
      preference_id: mpPreference.id,
      init_point: mpPreference.init_point
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
