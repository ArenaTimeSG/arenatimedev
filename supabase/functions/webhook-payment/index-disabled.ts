import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('🔔 WEBHOOK PAGAMENTO - Method:', req.method)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers from: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📨 Webhook body received:', JSON.stringify(body, null, 2))

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Salvar dados do webhook
    const { data: webhookData, error: webhookError } = await supabase
      .from('webhook_notifications')
      .insert({
        topic: 'payment',
        data: body,
        processed: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (webhookError) {
      console.error('❌ Erro ao salvar webhook:', webhookError)
    } else {
      console.log('✅ Webhook salvo:', webhookData.id)
    }

    // DESABILITADO: Criar agendamento - Webhook notification-webhook responsável
    console.log('🚫 IMPORTANTE: Criação de agendamento DESABILITADA nesta função');
    console.log('🚫 notification-webhook é responsável pela criação de agendamentos pagos');

    // Marcar webhook como processado
    if (webhookData) {
      await supabase
        .from('webhook_notifications')
        .update({ processed: true })
        .eq('id', webhookData.id)
    }

    return new Response('ok', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
})
