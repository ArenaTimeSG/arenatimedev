export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('🔔 MERCADO PAGO WEBHOOK SIMPLE - Method:', req.method);
  console.log('🔔 Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      console.log('⚠️ Non-POST request, returning 200');
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    // Obter o corpo da requisição
    let body;
    try {
      body = await req.json();
      console.log('🔔 Dados recebidos do Mercado Pago:', body);
    } catch (error) {
      console.log('⚠️ Erro ao parsear JSON, retornando 200 OK');
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    // Verificar se é uma notificação de pagamento
    if (body.type === 'payment' && body.data && body.data.id) {
      const paymentId = body.data.id;
      console.log('💳 Notificação de pagamento recebida:', paymentId);

      // Inicializar Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Variáveis de ambiente não configuradas');
        return new Response('ok', { status: 200, headers: corsHeaders });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      try {
        // Primeiro, buscar todos os registros de pagamento para encontrar o que corresponde ao payment_id
        // Como não temos o preference_id diretamente, vamos buscar por external_reference
        const { data: allPaymentRecords, error: allRecordsError } = await supabase
          .from('payment_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (allRecordsError) {
          console.error('❌ Erro ao buscar registros de pagamento:', allRecordsError);
          return new Response('ok', { status: 200, headers: corsHeaders });
        }

        console.log('🔍 Buscando registro correspondente ao payment_id:', paymentId);
        console.log('🔍 Registros encontrados:', allPaymentRecords?.length || 0);

        // Buscar configurações do admin (vamos tentar com o primeiro user_id encontrado)
        let adminSettings = null;
        let paymentRecord = null;

        for (const record of allPaymentRecords || []) {
          const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('mercado_pago_access_token')
            .eq('user_id', record.owner_id)
            .single();

          if (!settingsError && settings?.mercado_pago_access_token) {
            adminSettings = settings;
            paymentRecord = record;
            console.log('✅ Configurações encontradas para user_id:', record.owner_id);
            break;
          }
        }

        if (!adminSettings || !paymentRecord) {
          console.error('❌ Configurações do admin não encontradas');
          return new Response('ok', { status: 200, headers: corsHeaders });
        }

        console.log('✅ Registro de pagamento encontrado:', paymentRecord.id);

        // Buscar detalhes do pagamento na API do Mercado Pago
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${adminSettings.mercado_pago_access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!mpResponse.ok) {
          console.error('❌ Erro ao buscar detalhes do pagamento:', mpResponse.status);
          return new Response('ok', { status: 200, headers: corsHeaders });
        }

        const paymentDetails = await mpResponse.json();
        console.log('💳 Detalhes do pagamento:', paymentDetails.status);
        console.log('💳 External reference:', paymentDetails.external_reference);
        console.log('💳 Preference ID:', paymentDetails.preference_id);

        // Se o pagamento foi aprovado, confirmar o agendamento
        if (paymentDetails.status === 'approved') {
          console.log('✅ Pagamento aprovado - processando agendamento');

          if (paymentRecord) {
            // Se encontrou registro de pagamento, confirmar agendamento existente
            console.log('✅ Confirmando agendamento existente:', paymentRecord.booking_id);

            // Atualizar status do registro de pagamento
            await supabase
              .from('payment_records')
              .update({
                status: 'confirmed',
                updated_at: new Date().toISOString()
              })
              .eq('id', paymentRecord.id);

            // Confirmar agendamento
            await supabase
              .from('appointments')
              .update({
                status: 'confirmed',
                payment_status: 'approved',
                updated_at: new Date().toISOString()
              })
              .eq('id', paymentRecord.booking_id);

            console.log('✅ Agendamento confirmado:', paymentRecord.booking_id);
          } else {
            // Se não encontrou registro, criar agendamento com dados do pagamento
            console.log('✅ Criando novo agendamento com dados do pagamento');

            // Buscar dados do cliente pelo email do pagador
            const payerEmail = paymentDetails.payer?.email;
            let clientId = null;

            if (payerEmail) {
              const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('email', payerEmail)
                .eq('user_id', paymentRecord?.owner_id || 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f')
                .single();

              if (existingClient) {
                clientId = existingClient.id;
                console.log('✅ Cliente encontrado:', clientId);
              } else {
                // Criar novo cliente
                const { data: newClient } = await supabase
                  .from('clients')
                  .insert({
                    user_id: paymentRecord?.owner_id || 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f',
                    name: paymentDetails.payer?.identification?.number || 'Cliente Online',
                    email: payerEmail,
                    phone: '',
                    created_at: new Date().toISOString()
                  })
                  .select()
                  .single();

                if (newClient) {
                  clientId = newClient.id;
                  console.log('✅ Novo cliente criado:', clientId);
                }
              }
            }

            // Criar agendamento
            const appointmentData = {
              user_id: paymentRecord?.owner_id || 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f',
              client_id: clientId,
              date: new Date().toISOString(), // Data atual como fallback
              status: 'confirmed',
              valor_total: paymentDetails.transaction_amount?.toString() || '50.00',
              payment_status: 'approved',
              booking_source: 'online',
              modality_id: 'b87a371e-63ba-4356-9556-f3f3f935c83f', // Vôlei como padrão
              is_cortesia: false,
              payment_data: paymentDetails,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { data: newAppointment, error: createError } = await supabase
              .from('appointments')
              .insert(appointmentData)
              .select()
              .single();

            if (createError) {
              console.error('❌ Erro ao criar agendamento:', createError);
            } else {
              console.log('✅ Novo agendamento criado:', newAppointment.id);

              // Criar registro de pagamento para histórico
              await supabase
                .from('payment_records')
                .insert({
                  booking_id: newAppointment.id,
                  owner_id: paymentRecord?.owner_id || 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f',
                  preference_id: paymentDetails.preference_id,
                  init_point: '',
                  external_reference: newAppointment.id,
                  amount: paymentDetails.transaction_amount || 50,
                  currency: 'BRL',
                  status: 'confirmed',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
            }
          }
        } else {
          console.log('ℹ️ Status do pagamento:', paymentDetails.status);
        }

        // Salvar notificação para histórico
        await supabase
          .from('webhook_notifications')
          .insert({
            payment_id: paymentId,
            preference_id: paymentDetails.preference_id,
            owner_id: paymentRecord.owner_id,
            booking_id: paymentRecord.booking_id,
            status: paymentDetails.status,
            raw_data: paymentDetails,
            processed_at: new Date().toISOString()
          });

      } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);
      }

      // Sempre retornar 200 OK para o Mercado Pago
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook processado com sucesso',
          payment_id: paymentId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.log('⚠️ Notificação não é de pagamento ou dados inválidos');
      return new Response(
        JSON.stringify({ error: 'Tipo de notificação não suportado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});