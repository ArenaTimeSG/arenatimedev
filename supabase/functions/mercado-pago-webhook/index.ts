import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Obter dados da notificação
    const notification = await req.json()
    console.log('🔔 Webhook recebido:', notification)

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

    // Verificar se é uma notificação de pagamento
    if (notification.type === 'payment') {
      const paymentId = notification.data.id
      
      // Buscar informações do pagamento no Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`
        }
      })

      if (!paymentResponse.ok) {
        console.error('❌ Erro ao buscar pagamento no Mercado Pago')
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar pagamento' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const payment = await paymentResponse.json()
      console.log('💳 Pagamento encontrado:', payment.id, payment.status)

      // Buscar o pagamento no banco usando external_reference
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select(`
          *,
          appointments!inner(
            user_id,
            settings!inner(
              mercado_pago_access_token
            )
          )
        `)
        .eq('mercado_pago_id', payment.external_reference)
        .single()

      if (paymentError) {
        console.error('❌ Erro ao buscar pagamento no banco:', paymentError)
        return new Response(
          JSON.stringify({ error: 'Pagamento não encontrado' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const mercadoPagoAccessToken = paymentData.appointments.settings.mercado_pago_access_token

      // Determinar status do pagamento
      let paymentStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' = 'pending'
      let appointmentStatus: 'a_cobrar' | 'pago' | 'agendado' = 'a_cobrar'
      let appointmentPaymentStatus: 'pending' | 'failed' = 'pending'

      switch (payment.status) {
        case 'approved':
          paymentStatus = 'approved'
          appointmentStatus = 'pago' // Usar o status "pago" existente
          appointmentPaymentStatus = 'pending' // Limpar o payment_status quando pago
          break
        case 'rejected':
        case 'cancelled':
          paymentStatus = payment.status === 'rejected' ? 'rejected' : 'cancelled'
          appointmentPaymentStatus = 'failed'
          break
        case 'pending':
        case 'in_process':
          paymentStatus = 'pending'
          appointmentPaymentStatus = 'pending'
          break
        default:
          console.log('⚠️ Status desconhecido:', payment.status)
      }

      // Atualizar pagamento no banco
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: paymentStatus,
          mercado_pago_status: payment.status,
          mercado_pago_payment_id: payment.id,
          payment_method: payment.payment_method_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.id)

      if (updatePaymentError) {
        console.error('❌ Erro ao atualizar pagamento:', updatePaymentError)
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar pagamento' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Atualizar status do agendamento
      const { error: updateAppointmentError } = await supabase
        .from('appointments')
        .update({ 
          status: appointmentStatus,
          payment_status: appointmentPaymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.appointment_id)

      if (updateAppointmentError) {
        console.error('❌ Erro ao atualizar agendamento:', updateAppointmentError)
      }

      console.log('✅ Status atualizado:', {
        payment_id: paymentData.id,
        payment_status: paymentStatus,
        appointment_status: appointmentStatus,
        appointment_payment_status: appointmentPaymentStatus
      })

      // Se o pagamento foi aprovado, o agendamento já foi marcado como "pago" acima
      if (paymentStatus === 'approved') {
        console.log('✅ Agendamento marcado como pago automaticamente')
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
