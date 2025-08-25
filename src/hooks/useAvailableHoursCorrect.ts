import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AvailableHoursParams {
  adminUserId: string;
  selectedDate: Date;
  workingHours: any;
  tempoMinimoAntecedencia: number;
}

export const useAvailableHoursCorrect = ({
  adminUserId,
  selectedDate,
  workingHours,
  tempoMinimoAntecedencia
}: AvailableHoursParams) => {
  return useQuery({
    queryKey: ['availableHours', adminUserId, format(selectedDate, 'yyyy-MM-dd'), workingHours],
    queryFn: async () => {
      console.log('🔍 useAvailableHoursCorrect - Iniciando busca de horários disponíveis');
      console.log('🔍 Parâmetros:', { adminUserId, selectedDate, workingHours, tempoMinimoAntecedencia });

      // 1. Normalizar a data
      const normalizedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('🔍 Data normalizada:', normalizedDate);

      // 2. Obter o dia da semana (0 = domingo, 1 = segunda, etc.)
      const dayOfWeek = selectedDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      console.log('🔍 Dia da semana:', dayName);

      // 3. Verificar se o dia está habilitado
      const daySchedule = workingHours?.[dayName];
      if (!daySchedule || !daySchedule.enabled) {
        console.log('🔍 Dia não habilitado ou sem configuração');
        return [];
      }

      console.log('🔍 Configuração do dia:', daySchedule);

      // 4. Gerar todos os horários possíveis baseados no working_hours
      const startHour = parseInt(daySchedule.start.split(':')[0]);
      const endHour = parseInt(daySchedule.end.split(':')[0]);
      
      console.log('🔍 Horário de início:', startHour, 'Horário de fim:', endHour);

      const allHours: string[] = [];
      
      // Gerar horários de hora em hora
      for (let hour = startHour; hour < endHour; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        allHours.push(timeString);
      }

      console.log('🔍 Todos os horários possíveis:', allHours);

      // 5. Buscar agendamentos existentes para este dia
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('date, status')
        .eq('user_id', adminUserId)
        .gte('date', `${normalizedDate}T00:00:00`)
        .lt('date', `${normalizedDate}T23:59:59`)
        .in('status', ['agendado', 'pago']); // Apenas agendamentos confirmados

      if (appointmentsError) {
        console.error('❌ Erro ao buscar agendamentos:', appointmentsError);
        throw new Error(`Erro ao buscar agendamentos: ${appointmentsError.message}`);
      }

      console.log('🔍 Agendamentos existentes:', existingAppointments);

      // 6. Extrair horários ocupados dos agendamentos existentes
      const occupiedHours = existingAppointments?.map(apt => {
        const appointmentDate = new Date(apt.date);
        const hour = appointmentDate.getHours();
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        console.log(`🔍 Agendamento: ${apt.date} -> Hora: ${timeString}, Status: ${apt.status}`);
        return timeString;
      }) || [];

      console.log('🔍 Horários ocupados finais:', occupiedHours);

      // 7. Filtrar horários disponíveis
      const availableHours = allHours.filter(hour => {
        const isOccupied = occupiedHours.includes(hour);
        console.log(`🔍 Horário ${hour}: ${isOccupied ? 'OCUPADO' : 'DISPONÍVEL'}`);
        return !isOccupied;
      });

      console.log('🔍 Horários disponíveis finais:', availableHours);

      // 8. Aplicar regra de tempo mínimo de antecedência
      const now = new Date();
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(0, 0, 0, 0);
      
      const timeDiff = selectedDateTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      console.log('🔍 Diferença de horas:', hoursDiff, 'Tempo mínimo:', tempoMinimoAntecedencia);

      if (hoursDiff < tempoMinimoAntecedencia) {
        console.log('🔍 Aplicando filtro de tempo mínimo de antecedência');
        // Se não atende ao tempo mínimo, retornar vazio
        return [];
      }

      return availableHours;
    },
    enabled: !!adminUserId && !!selectedDate && !!workingHours,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};
