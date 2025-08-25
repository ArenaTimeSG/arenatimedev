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

interface UseAvailableHoursSyncProps {
  workingHours: WorkingHours;
  selectedDate: Date;
  tempoMinimoAntecedencia?: number; // em horas
  existingAppointments?: Array<{ date: string; modality: string }>;
  modalityDuration?: number; // duração da modalidade em minutos
}

export const useAvailableHoursSync = ({
  workingHours,
  selectedDate,
  tempoMinimoAntecedencia = 24,
  existingAppointments = [],
  modalityDuration = 60
}: UseAvailableHoursSyncProps) => {
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
      
      const allHours: string[] = [];
      
      for (let hour = startHour; hour < endHour; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        allHours.push(timeString);
      }

      // Se não há agendamentos existentes, retorna todos os horários
      if (existingAppointments.length === 0) {
        return allHours;
      }

      // Criar array de horários ocupados
      const occupiedTimes: string[] = [];
      
      existingAppointments.forEach(appointment => {
        const appointmentDate = new Date(appointment.date);
        const appointmentHour = format(appointmentDate, 'HH:mm');
        
        // Adicionar o horário do agendamento
        occupiedTimes.push(appointmentHour);
        
        // Adicionar horários subsequentes baseados na duração da modalidade
        const durationHours = Math.ceil(modalityDuration / 60);
        for (let i = 1; i < durationHours; i++) {
          const nextHour = appointmentDate.getHours() + i;
          if (nextHour < endHour) {
            const nextHourString = `${nextHour.toString().padStart(2, '0')}:00`;
            occupiedTimes.push(nextHourString);
          }
        }
      });

      // Filtrar horários disponíveis
      const availableHours = allHours.filter(hour => !occupiedTimes.includes(hour));
      
      return availableHours;
    } catch (error) {
      console.error('Erro ao gerar horários disponíveis:', error);
      return [];
    }
  }, [workingHours, selectedDate, tempoMinimoAntecedencia, existingAppointments, modalityDuration]);
};
