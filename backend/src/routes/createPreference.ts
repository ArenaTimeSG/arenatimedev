import { Request, Response } from 'express';
import { mercadopago } from '../config/mercadopago';
import { supabase } from '../config/supabase';
import { CreatePreferenceRequest, CreatePreferenceResponse } from '../types/payment';

export const createPreference = async (req: Request, res: Response) => {
  console.log('🚀 [CREATE-PREFERENCE] Iniciando criação de preferência');
  console.log('📥 [CREATE-PREFERENCE] Dados recebidos:', JSON.stringify(req.body, null, 2));

  try {
    const { description, amount, user_id, client_name, client_email, booking_id }: CreatePreferenceRequest = req.body;

    // Validar campos obrigatórios
    if (!description || !amount || !user_id || !client_name || !client_email || !booking_id) {
      console.error('❌ [CREATE-PREFERENCE] Campos obrigatórios ausentes');
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: description, amount, user_id, client_name, client_email, booking_id'
      } as CreatePreferenceResponse);
    }

    // Verificar se o agendamento existe
    console.log('🔍 [CREATE-PREFERENCE] Verificando se agendamento existe:', booking_id);
    const { data: booking, error: bookingError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('❌ [CREATE-PREFERENCE] Agendamento não encontrado:', bookingError);
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      } as CreatePreferenceResponse);
    }

    console.log('✅ [CREATE-PREFERENCE] Agendamento encontrado:', booking.id);

    // Criar preferência do Mercado Pago
    console.log('💳 [CREATE-PREFERENCE] Criando preferência no Mercado Pago...');
    
    const preference = {
      items: [
        {
          title: description,
          unit_price: Number(amount),
          quantity: 1,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: client_name,
        email: client_email
      },
      external_reference: booking_id, // ID do agendamento
      notification_url: `${process.env.WEBHOOK_URL || 'https://arenatime.vercel.app'}/api/webhook`,
      back_urls: {
        success: `${process.env.FRONTEND_URL || 'https://arenatime.vercel.app'}/payment/success`,
        failure: `${process.env.FRONTEND_URL || 'https://arenatime.vercel.app'}/payment/failure`,
        pending: `${process.env.FRONTEND_URL || 'https://arenatime.vercel.app'}/payment/pending`
      },
      auto_return: 'approved'
    };

    console.log('💳 [CREATE-PREFERENCE] Dados da preferência:', JSON.stringify(preference, null, 2));

    const response = await mercadopago.preferences.create(preference);
    const preferenceData = response.body;

    console.log('✅ [CREATE-PREFERENCE] Preferência criada com sucesso!');
    console.log('🆔 [CREATE-PREFERENCE] Preference ID:', preferenceData.id);
    console.log('🔗 [CREATE-PREFERENCE] External Reference (Booking ID):', booking_id);
    console.log('💰 [CREATE-PREFERENCE] Valor:', amount);
    console.log('👤 [CREATE-PREFERENCE] Cliente:', client_name);
    console.log('📧 [CREATE-PREFERENCE] Email:', client_email);
    console.log('🔔 [CREATE-PREFERENCE] Webhook URL:', preference.notification_url);

    // Atualizar agendamento com dados do pagamento
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    if (updateError) {
      console.error('⚠️ [CREATE-PREFERENCE] Erro ao atualizar agendamento:', updateError);
    } else {
      console.log('✅ [CREATE-PREFERENCE] Agendamento atualizado com status pending');
    }

    const responseData: CreatePreferenceResponse = {
      success: true,
      preference_id: preferenceData.id,
      init_point: preferenceData.init_point,
      sandbox_init_point: preferenceData.sandbox_init_point
    };

    console.log('📤 [CREATE-PREFERENCE] Retornando resposta:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('❌ [CREATE-PREFERENCE] Erro ao criar preferência:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as CreatePreferenceResponse);
  }
};
