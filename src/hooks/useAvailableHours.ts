import { useQuery } from '@tanstack/react-query';
import { format, addDays, isBefore, startOfDay, addMinutes, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface WorkingHours {
  monday: { enabled: boolean; start: string; end: string };
  tuesday: { enabled: boolean; start: string; end: string };
  wednesday: { enabled: boolean; start: string; end: string };
  thursday: { enabled: boolean; start: string; end: string };
  friday: { enabled: boolean; start: string; end: string };
  saturday: { enabled: boolean; start: string; end: string };
  sunday: { enabled: boolean; start: string; end: string };
}

interface UseAvailableHoursProps {
  workingHours: WorkingHours;
  selectedDate: Date;
  tempoMinimoAntecedencia?: number; // em horas
  adminUserId?: string; // ID do admin para filtrar agendamentos
  modalityDuration?: number; // duração da modalidade em minutos
}

export const useAvailableHours = ({
  workingHours,
  selectedDate,
  tempoMinimoAntecedencia = 24,
  adminUserId,
  modalityDuration = 60
}: UseAvailableHoursProps) => {
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['availableHours', adminUserId, dateKey, modalityDuration],
    queryFn: async (): Promise<string[]> => {
      try {
        const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase() as keyof WorkingHours;
        const daySchedule = workingHours[dayOfWeek];

        // Se o dia não está habilitado, retorna array vazio
        if (!daySchedule?.enabled) {
          return [];
        }

        // Verificar se a data está dentro do tempo mínimo de antecedência
        const now = new Date();
        const minTime = addDays(now, tempoMinimoAntecedencia / 24);
        
        if (isBefore(selectedDate, startOfDay(minTime))) {
          return [];
        }

        // Gerar horários disponíveis baseados no horário de funcionamento
        const startHour = parseInt(daySchedule.start.split(':')[0]);
        const endHour = parseInt(daySchedule.end.split(':')[0]);
        
        const allHours: string[] = [];
        
        for (let hour = startHour; hour < endHour; hour++) {
          const timeString = `${hour.toString().padStart(2, '0')}:00`;
          allHours.push(timeString);
        }

        // Se não há adminUserId, retorna todos os horários
        if (!adminUserId) {
          return allHours;
        }

        // Buscar agendamentos existentes para este admin na data selecionada
        const startOfSelectedDate = startOfDay(selectedDate);
        const endOfSelectedDate = addDays(startOfSelectedDate, 1);

        const { data: existingAppointments, error } = await supabase
          .from('appointments')
          .select('date, modality')
          .eq('user_id', adminUserId)
          .gte('date', startOfSelectedDate.toISOString())
          .lt('date', endOfSelectedDate.toISOString())
          .not('status', 'eq', 'cancelado');

        if (error) {
          console.error('Erro ao buscar agendamentos:', error);
          return allHours;
        }

        // Criar array de horários ocupados
        const occupiedTimes: string[] = [];
        
        existingAppointments?.forEach(appointment => {
          const appointmentDate = parseISO(appointment.date);
          const appointmentHour = format(appointmentDate, 'HH:mm');
          
          // Adicionar o horário do agendamento e os próximos horários baseados na duração
          occupiedTimes.push(appointmentHour);
          
          // Adicionar horários subsequentes baseados na duração da modalidade
          let currentTime = appointmentDate;
          for (let i = 1; i < Math.ceil(modalityDuration / 60); i++) {
            currentTime = addMinutes(currentTime, 60);
            const nextHour = format(currentTime, 'HH:mm');
            occupiedTimes.push(nextHour);
          }
        });

        // Filtrar horários disponíveis
        const availableHours = allHours.filter(hour => !occupiedTimes.includes(hour));
        
        return availableHours;
      } catch (error) {
        console.error('Erro ao gerar horários disponíveis:', error);
        return [];
      }
    },
    staleTime: 1000 * 10, // 10 segundos para horários disponíveis (muito responsivo)
    gcTime: 1000 * 60 * 2, // 2 minutos de cache
    enabled: !!adminUserId && !!selectedDate,
  });
};
