import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { WebhookNotification } from '../types/payment';

export const webhook = async (req: Request, res: Response) => {
  console.log('🚀 [WEBHOOK] Webhook recebido do Mercado Pago');
  console.log('📥 [WEBHOOK] Method:', req.method);
  console.log('📥 [WEBHOOK] Query:', req.query);
  console.log('📥 [WEBHOOK] Body:', JSON.stringify(req.body, null, 2));
  console.log('📥 [WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));

  try {
    // Extrair paymentId do query string (formato do Mercado Pago)
    const paymentId = req.query['data.id'] as string;
    
    if (!paymentId) {
      console.error('❌ [WEBHOOK] Payment ID não encontrado no query');
      return res.status(400).json({ error: 'Payment ID não encontrado' });
    }

    console.log('💳 [WEBHOOK] Processando pagamento ID:', paymentId);

    // Consultar pagamento na API do Mercado Pago
    console.log('🔍 [WEBHOOK] Consultando pagamento na API do Mercado Pago...');
    
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpResponse.ok) {
      console.error('❌ [WEBHOOK] Erro ao consultar pagamento:', mpResponse.status);
      return res.status(500).json({ error: 'Erro ao consultar pagamento' });
    }

    const payment = await mpResponse.json();
    console.log('💳 [WEBHOOK] Detalhes do pagamento:', JSON.stringify(payment, null, 2));
    console.log('💳 [WEBHOOK] Status do pagamento:', payment.status);
    console.log('💳 [WEBHOOK] External Reference (Booking ID):', payment.external_reference);

    // Extrair booking_id do external_reference
    const bookingId = payment.external_reference;
    if (!bookingId) {
      console.error('❌ [WEBHOOK] External reference (booking_id) não encontrado');
      return res.status(400).json({ error: 'Booking ID não encontrado' });
    }

    console.log('🔍 [WEBHOOK] Buscando agendamento com ID:', bookingId);

    // Buscar agendamento no Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('❌ [WEBHOOK] Agendamento não encontrado:', bookingError);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log('✅ [WEBHOOK] Agendamento encontrado:', booking.id);

    // Processar baseado no status do pagamento
    if (payment.status === 'approved') {
      console.log('✅ [WEBHOOK] Pagamento aprovado - Atualizando agendamento');
      
      // Atualizar agendamento para status "pago"
      const { data: updatedBooking, error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'pago',
          payment_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [WEBHOOK] Erro ao atualizar agendamento:', updateError);
        return res.status(500).json({ error: 'Erro ao atualizar agendamento' });
      }

      console.log('✅ [WEBHOOK] Agendamento atualizado com sucesso:', updatedBooking.id);

      // Criar/atualizar registro na tabela payments
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('appointment_id', bookingId)
        .single();

      if (!existingPayment) {
        console.log('💳 [WEBHOOK] Criando registro de pagamento...');
        const { data: newPayment, error: paymentInsertError } = await supabase
          .from('payments')
          .insert({
            appointment_id: bookingId,
            amount: payment.transaction_amount,
            currency: 'BRL',
            status: 'approved',
            payment_method: payment.payment_method_id,
            mercado_pago_id: payment.preference_id,
            mercado_pago_status: payment.status,
            mercado_pago_payment_id: payment.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (paymentInsertError) {
          console.error('❌ [WEBHOOK] Erro ao criar registro de pagamento:', paymentInsertError);
        } else {
          console.log('✅ [WEBHOOK] Registro de pagamento criado:', newPayment.id);
        }
      } else {
        console.log('💳 [WEBHOOK] Atualizando registro de pagamento existente...');
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({
            status: 'approved',
            mercado_pago_status: payment.status,
            mercado_pago_payment_id: payment.id,
            updated_at: new Date().toISOString()
          })
          .eq('appointment_id', bookingId);

        if (paymentUpdateError) {
          console.error('❌ [WEBHOOK] Erro ao atualizar registro de pagamento:', paymentUpdateError);
        } else {
          console.log('✅ [WEBHOOK] Registro de pagamento atualizado');
        }
      }

      console.log('🎉 [WEBHOOK] Pagamento processado com sucesso!');
      return res.status(200).json({ 
        message: 'Pagamento aprovado e agendamento confirmado',
        booking_id: bookingId,
        payment_id: paymentId,
        status: 'approved'
      });

    } else if (payment.status === 'pending' || payment.status === 'in_process') {
      console.log('⏳ [WEBHOOK] Pagamento pendente - Atualizando status');
      
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          payment_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('❌ [WEBHOOK] Erro ao atualizar status do agendamento:', updateError);
      } else {
        console.log('✅ [WEBHOOK] Status do agendamento atualizado para pendente');
      }

      return res.status(200).json({ 
        message: 'Pagamento pendente',
        booking_id: bookingId,
        payment_id: paymentId,
        status: 'pending'
      });

    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      console.log('❌ [WEBHOOK] Pagamento rejeitado/cancelado - Atualizando status');
      
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('❌ [WEBHOOK] Erro ao atualizar status do agendamento:', updateError);
      } else {
        console.log('✅ [WEBHOOK] Status do agendamento atualizado para falhou');
      }

      return res.status(200).json({ 
        message: 'Pagamento rejeitado',
        booking_id: bookingId,
        payment_id: paymentId,
        status: 'rejected'
      });

    } else {
      console.log('⚠️ [WEBHOOK] Status de pagamento não reconhecido:', payment.status);
      return res.status(200).json({ 
        message: 'Status não reconhecido',
        booking_id: bookingId,
        payment_id: paymentId,
        status: payment.status
      });
    }

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
