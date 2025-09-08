export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('🔍 CHECK PAYMENT STATUS - Method:', req.method);
  console.log('🔍 CHECK PAYMENT STATUS - URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      console.log('⚠️ Non-POST request, returning 405');
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const body = await req.json();
    console.log('🔍 Dados recebidos:', body);

    const { user_id, amount, description } = body;
    console.log('🔍 Campos extraídos:', { user_id, amount, description });

    if (!user_id || !amount || !description) {
      console.error('❌ Campos obrigatórios ausentes');
      return new Response('Missing required fields', { status: 400, headers: corsHeaders });
    }

    // Obter variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas');
      return new Response("Configuração inválida", { status: 500, headers: corsHeaders });
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do administrador (precisamos do access_token)
    const { data: allSettings, error: settingsError } = await supabase
      .from('settings')
      .select('user_id, mercado_pago_access_token')
      .not('mercado_pago_access_token', 'is', null);

    if (settingsError || !allSettings || allSettings.length === 0) {
      console.error('❌ Nenhum access token do Mercado Pago encontrado');
      return new Response("Mercado Pago not configured", { status: 400, headers: corsHeaders });
    }

    const mpAccessToken = allSettings[0].mercado_pago_access_token;
    console.log('🔍 Usando access token do admin');

    // Buscar pagamentos recentes no Mercado Pago
    console.log('🔍 Buscando pagamentos recentes no Mercado Pago...');
    
    // Buscar pagamentos dos últimos 30 minutos (mais amplo)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    
    console.log('🔍 Buscando pagamentos entre:', thirtyMinutesAgo, 'e', now);
    
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&range=date_created&begin_date=${thirtyMinutesAgo}&end_date=${now}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpRes.ok) {
      console.error('❌ Erro ao buscar pagamentos no Mercado Pago:', mpRes.status);
      return new Response("Erro ao consultar pagamentos", { status: 500, headers: corsHeaders });
    }

    const searchResult = await mpRes.json();
    console.log('🔍 Resultado da busca:', JSON.stringify(searchResult, null, 2));
    console.log('🔍 Total de pagamentos encontrados:', searchResult.results?.length || 0);

    // Procurar por pagamento que corresponda aos dados fornecidos
    for (const payment of searchResult.results || []) {
      console.log('🔍 Verificando pagamento:', {
        id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
        description: payment.description,
        date: payment.date_created
      });
      
      if (payment.status === "approved" && 
          payment.transaction_amount === amount && 
          payment.description === description) {
        
        console.log('✅ Pagamento aprovado encontrado!', payment.id);
        
        // Verificar se já existe agendamento para este pagamento
        const { data: existingAppointment } = await supabase
          .from('appointments')
          .select('*')
          .eq('payment_status', 'approved')
          .eq('valor_total', amount)
          .gte('created_at', tenMinutesAgo)
          .limit(1);

        if (existingAppointment && existingAppointment.length > 0) {
          console.log('✅ Agendamento já existe:', existingAppointment[0].id);
          return new Response(JSON.stringify({ 
            payment_approved: true, 
            appointment_exists: true,
            appointment_id: existingAppointment[0].id 
          }), { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }

        // Criar agendamento se não existir
        console.log('🔍 Criando agendamento para pagamento aprovado...');
        
        const { data: newAppointment, error: insertError } = await supabase
          .from('appointments')
          .insert({
            user_id: allSettings[0].user_id,
            client_id: payment.payer?.email || '',
            date: new Date().toISOString(),
            status: 'agendado',
            modality: payment.description || 'Agendamento',
            valor_total: payment.transaction_amount,
            payment_status: 'approved',
            booking_source: 'online',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Erro ao criar agendamento:', insertError);
          return new Response("Erro ao criar agendamento", { status: 500, headers: corsHeaders });
        }

        console.log('✅ Agendamento criado com sucesso:', newAppointment.id);
        return new Response(JSON.stringify({ 
          payment_approved: true, 
          appointment_created: true,
          appointment_id: newAppointment.id 
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    console.log('⚠️ Nenhum pagamento aprovado encontrado');
    return new Response(JSON.stringify({ payment_approved: false }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return new Response("Erro interno", { status: 500, headers: corsHeaders });
  }
});
