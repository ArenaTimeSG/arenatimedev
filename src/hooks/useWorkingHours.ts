import { useMemo, useCallback } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { format, isSameDay, parseISO } from 'date-fns';
import { DAY_ORDER } from '@/types/settings';

export const useWorkingHours = () => {
  const { settings } = useSettings();

  // Mapeamento de dias da semana para as chaves das configurações
  // getDay() retorna: 0 = Domingo, 1 = Segunda, 2 = Terça, etc.
  const dayMapping = useMemo(() => ({
    0: 'sunday',    // Domingo
    1: 'monday',    // Segunda
    2: 'tuesday',   // Terça
    3: 'wednesday', // Quarta
    4: 'thursday',  // Quinta
    5: 'friday',    // Sexta
    6: 'saturday'   // Sábado
  }), []);

  // Verificar se um dia está habilitado
  const isDayEnabled = useCallback((date: Date): boolean => {
    const dayOfWeek = date.getDay();
    const dayKey = dayMapping[dayOfWeek];
    
    if (!dayKey || !settings?.working_hours) {
      return false;
    }

    const daySchedule = settings.working_hours[dayKey];
    const isEnabled = daySchedule?.enabled || false;
    

    
    return isEnabled;
  }, [settings?.working_hours, dayMapping]);

  // Verificar se um horário específico está disponível
  const isTimeSlotAvailable = useCallback((date: Date, timeSlot: string): boolean => {
    // Se o dia não está habilitado, o horário não está disponível
    if (!isDayEnabled(date)) {
      return false;
    }

    const dayOfWeek = date.getDay();
    const dayKey = dayMapping[dayOfWeek];
    
    if (!dayKey || !settings?.working_hours) {
      return false;
    }

    const daySchedule = settings.working_hours[dayKey];
    
    if (!daySchedule?.enabled) {
      return false;
    }

    // Converter horário do slot para minutos
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const slotMinutes = parseInt(timeSlot.split(':')[1] || '0');
    const slotTimeInMinutes = slotHour * 60 + slotMinutes;

    // Converter horários de início e fim para minutos
    const startHour = parseInt(daySchedule.start.split(':')[0]);
    const startMinutes = parseInt(daySchedule.start.split(':')[1]);
    const startTimeInMinutes = startHour * 60 + startMinutes;

    let endHour = parseInt(daySchedule.end.split(':')[0]);
    const endMinutes = parseInt(daySchedule.end.split(':')[1]);
    let endTimeInMinutes = endHour * 60 + endMinutes;

    // Se end_time = 00:00, tratar como 23:59:59 (fim do dia)
    if (endHour === 0 && endMinutes === 0) {
      endTimeInMinutes = 23 * 60 + 59; // 23:59
    }

    // Verificar se o funcionamento atravessa a madrugada
    const crossesMidnight = endTimeInMinutes < startTimeInMinutes;

    if (crossesMidnight) {
      // Funcionamento atravessa a madrugada (ex: 18:00 - 02:00)
      // Horário é válido se: >= startTime OU < endTime
      return slotTimeInMinutes >= startTimeInMinutes || slotTimeInMinutes < endTimeInMinutes;
    } else {
      // Funcionamento normal no mesmo dia
      // Se o horário final é 23:59, incluir até 23:00
      if (endHour === 23 && endMinutes === 59) {
        return slotTimeInMinutes >= startTimeInMinutes && slotTimeInMinutes <= (23 * 60);
      }
      return slotTimeInMinutes >= startTimeInMinutes && slotTimeInMinutes < endTimeInMinutes;
    }
  }, [settings?.working_hours, dayMapping, isDayEnabled]);

  // Gerar slots de horário baseados nas configurações
  const generateTimeSlots = useCallback((): string[] => {
    if (!settings?.working_hours) {
      // Fallback para horários padrão se não houver configurações
      return Array.from({ length: 16 }, (_, i) => {
        const hour = i + 8; // 08:00 to 23:00
        return `${hour.toString().padStart(2, '0')}:00`;
      });
    }

    // Encontrar o horário mais cedo e mais tarde de todos os dias habilitados
    let earliestHour = 23;
    let latestHour = 8;

    Object.values(settings.working_hours).forEach(daySchedule => {
      if (daySchedule?.enabled) {
        const startHour = parseInt(daySchedule.start.split(':')[0]);
        let endHour = parseInt(daySchedule.end.split(':')[0]);
        
        // Se end_time = 00:00, tratar como 23:59
        if (endHour === 0) {
          endHour = 23;
        }
        
        earliestHour = Math.min(earliestHour, startHour);
        latestHour = Math.max(latestHour, endHour);
      }
    });

    // Gerar slots de hora em hora (incluindo horários após meia-noite se necessário)
    const slots: string[] = [];
    

    
    // Se o horário mais tarde é menor que o mais cedo, significa que atravessa a madrugada
    if (latestHour < earliestHour) {
      // Gerar slots de 00:00 até latestHour
      for (let hour = 0; hour <= latestHour; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
      }
      // Gerar slots de earliestHour até 23:00
      for (let hour = earliestHour; hour <= 23; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    } else {
      // Funcionamento normal no mesmo dia
      // Se o horário mais tarde é 23h, incluir até 23:00
      const maxHour = latestHour === 23 ? 23 : latestHour;
      for (let hour = earliestHour; hour <= maxHour; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    }


    return slots;
  }, [settings?.working_hours]);

  // Obter horário de funcionamento para um dia específico
  const getDaySchedule = useCallback((date: Date) => {
    const dayOfWeek = date.getDay();
    const dayKey = dayMapping[dayOfWeek];
    
    if (!dayKey || !settings?.working_hours) {
      return null;
    }

    return settings.working_hours[dayKey];
  }, [settings?.working_hours, dayMapping]);

  // Verificar se um horário está bloqueado (indisponível)
  const isTimeSlotBlocked = useCallback((date: Date, timeSlot: string): boolean => {
    // Se o dia não está habilitado, está bloqueado
    if (!isDayEnabled(date)) {
      return true;
    }

    // Se o horário não está disponível, está bloqueado
    if (!isTimeSlotAvailable(date, timeSlot)) {
      return true;
    }

    // Horário das 12h - bloqueado todos os dias (almoço)
    const slotHour = parseInt(timeSlot.split(':')[0]);
    if (slotHour === 12) {
      return true;
    }

    return false;
  }, [isDayEnabled, isTimeSlotAvailable]);

  // Obter cor de fundo para uma célula da agenda
  const getCellBackgroundColor = useCallback((date: Date, timeSlot: string, hasAppointment: boolean = false): string => {
    const isBlocked = isTimeSlotBlocked(date, timeSlot);
    
    if (isBlocked) {
      return 'bg-gray-300 cursor-not-allowed'; // Cinza para horários bloqueados
    }
    
    if (hasAppointment) {
      return 'bg-blue-50 border-blue-200'; // Azul para agendamentos
    }
    
    return 'bg-white hover:bg-muted/50'; // Branco para horários disponíveis
  }, [isTimeSlotBlocked]);

  // Verificar se um agendamento pode ser criado em um horário
  const canCreateAppointment = useCallback((date: Date, timeSlot: string): boolean => {
    return !isTimeSlotBlocked(date, timeSlot);
  }, [isTimeSlotBlocked]);

  // Obter horários disponíveis para um dia específico
  const getAvailableHoursForDay = useCallback((date: Date): string[] => {
    if (!isDayEnabled(date)) {
      return [];
    }

    const daySchedule = getDaySchedule(date);
    if (!daySchedule) {
      return [];
    }

    const startHour = parseInt(daySchedule.start.split(':')[0]);
    let endHour = parseInt(daySchedule.end.split(':')[0]);
    
    // Se end_time = 00:00, tratar como 23:59
    if (endHour === 0) {
      endHour = 23;
    }
    
    const availableHours: string[] = [];
    
    // Verificar se o funcionamento atravessa a madrugada
    if (endHour < startHour) {
      // Funcionamento atravessa a madrugada (ex: 18:00 - 02:00)
      // Gerar horários de startHour até 23:00
      for (let hour = startHour; hour <= 23; hour++) {
        if (hour !== 12) { // Excluir horário do almoço
          availableHours.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }
      // Gerar horários de 00:00 até endHour
      for (let hour = 0; hour < endHour; hour++) {
        if (hour !== 12) { // Excluir horário do almoço
          availableHours.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }
    } else {
      // Funcionamento normal no mesmo dia
      // Incluir o horário final se for 23h
      const maxHour = endHour === 23 ? 23 : endHour;
      for (let hour = startHour; hour <= maxHour; hour++) {
        if (hour !== 12) { // Excluir horário do almoço
          availableHours.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }
    }

    return availableHours;
  }, [isDayEnabled, getDaySchedule, dayMapping]);

  return {
    // Estados
    workingHours: settings?.working_hours,
    
    // Funções de verificação
    isDayEnabled,
    isTimeSlotAvailable,
    isTimeSlotBlocked,
    canCreateAppointment,
    
    // Funções de geração
    generateTimeSlots,
    getAvailableHoursForDay,
    
    // Funções de UI
    getCellBackgroundColor,
    getDaySchedule,
    
    // Utilitários
    dayMapping
  };
};
