import { useMemo } from 'react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';

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
}

export const useAvailableHours = ({
  workingHours,
  selectedDate,
  tempoMinimoAntecedencia = 24
}: UseAvailableHoursProps) => {
  return useMemo(() => {
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
      
      const hours: string[] = [];
      
      for (let hour = startHour; hour < endHour; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        hours.push(timeString);
      }

      return hours;
    } catch (error) {
      console.error('Erro ao gerar horários disponíveis:', error);
      return [];
    }
  }, [workingHours, selectedDate, tempoMinimoAntecedencia]);
};
