import { supabase } from '@/integrations/supabase/client';

/**
 * Atualiza automaticamente o status dos agendamentos recorrentes vencidos
 * de 'agendado' para 'a_cobrar' quando a data passa
 */
export const updateRecurringAppointmentsStatus = async (userId: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Início do dia

    // Buscar agendamentos recorrentes com status 'agendado' que já passaram da data
    const { data: expiredAppointments, error } = await supabase
      .from('appointments')
      .select('id, date, recurrence_id')
      .eq('user_id', userId)
      .eq('status', 'agendado')
      .not('recurrence_id', 'is', null)
      .lt('date', today.toISOString());

    if (error) {
      console.error('❌ Erro ao buscar agendamentos recorrentes vencidos:', error);
      return { success: false, error, updatedCount: 0 };
    }

    if (expiredAppointments && expiredAppointments.length > 0) {
      console.log('🔍 Atualizando status de agendamentos recorrentes vencidos:', {
        count: expiredAppointments.length,
        appointments: expiredAppointments.map(apt => ({
          id: apt.id,
          date: apt.date,
          recurrence_id: apt.recurrence_id
        }))
      });

      // Atualizar status para 'a_cobrar'
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'a_cobrar' })
        .in('id', expiredAppointments.map(apt => apt.id));

      if (updateError) {
        console.error('❌ Erro ao atualizar status dos agendamentos:', updateError);
        return { success: false, error: updateError, updatedCount: 0 };
      }

      console.log('✅ Status atualizado para', expiredAppointments.length, 'agendamentos recorrentes');

      return { 
        success: true, 
        error: null, 
        updatedCount: expiredAppointments.length,
        updatedAppointments: expiredAppointments
      };
    }

    return { success: true, error: null, updatedCount: 0 };
  } catch (error) {
    console.error('❌ Erro ao atualizar status dos agendamentos recorrentes:', error);
    return { success: false, error, updatedCount: 0 };
  }
};

