import { useMemo, useCallback, useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay, parseISO } from 'date-fns';
import { DAY_ORDER } from '@/types/settings';

export const useWorkingHours = () => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [manualBlockades, setManualBlockades] = useState<{[key: string]: {
    blocked: boolean, 
    reason: string, 
    description?: string,
    isRecurring?: boolean,
    endDate?: string,
    isIndefinite?: boolean,
    recurrenceType?: 'daily' | 'weekly' | 'monthly',
    originalDate?: string
  }}>({});

  // Carregar bloqueios do banco de dados
  useEffect(() => {
    if (user?.id) {
      loadBlockadesFromDatabase();
    }
  }, [user?.id]);

  const loadBlockadesFromDatabase = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('time_blockades')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (error) {
        console.error('Erro ao carregar bloqueios:', error);
        return;
      }

      // Converter dados do banco para o formato local
      const blockadesMap: {[key: string]: any} = {};
      data?.forEach(blockade => {
        const blockadeKey = `${blockade.date}-${blockade.time_slot}`;
        blockadesMap[blockadeKey] = {
          blocked: true,
          reason: blockade.reason,
          description: blockade.description,
          isRecurring: false, // Por enquanto, não implementamos recorrencia no banco
          originalDate: blockade.date
        };
      });

      setManualBlockades(blockadesMap);
    } catch (error) {
      console.error('Erro ao carregar bloqueios:', error);
    }
  };

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

    // Verificar bloqueios manuais (seguindo o mesmo padrão do bloqueio do meio-dia)
    const dateString = format(date, 'yyyy-MM-dd');
    const blockadeKey = `${dateString}-${timeSlot}`;
    if (manualBlockades[blockadeKey]?.blocked) {
      return true;
    }

    return false;
  }, [isDayEnabled, isTimeSlotAvailable, manualBlockades]);

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
    // Se o horário original termina às 00:00, não atravessa a madrugada (é fim do dia)
    const originalEndHour = parseInt(daySchedule.end.split(':')[0]);
    const originalEndMinutes = parseInt(daySchedule.end.split(':')[1] || '0');
    const crossesMidnight = (originalEndHour !== 0) && (endHour < startHour);
    
    if (crossesMidnight) {
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
      // Se endHour é 23 (após conversão de 00:00), incluir até 23:00
      const maxHour = endHour === 23 ? 23 : endHour;
      for (let hour = startHour; hour <= maxHour; hour++) {
        if (hour !== 12) { // Excluir horário do almoço
          availableHours.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }
    }

    // Filtrar horários bloqueados manualmente (seguindo o mesmo padrão do bloqueio do meio-dia)
    const dateString = format(date, 'yyyy-MM-dd');
    const filteredHours = availableHours.filter(hour => {
      const blockadeKey = `${dateString}-${hour}`;
      return !manualBlockades[blockadeKey]?.blocked;
    });

    return filteredHours;
  }, [isDayEnabled, getDaySchedule, dayMapping, manualBlockades]);

  // Função para bloquear um horário manualmente
  const blockTimeSlot = useCallback(async (
    date: Date, 
    timeSlot: string, 
    reason: string,
    options?: {
      description?: string;
      isRecurring?: boolean;
      endDate?: Date;
      isIndefinite?: boolean;
      recurrenceType?: 'daily' | 'weekly' | 'monthly';
    }
  ) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    const dateString = format(date, 'yyyy-MM-dd');
    const blockadeKey = `${dateString}-${timeSlot}`;
    
    try {
      // Salvar no banco de dados
      const { error } = await supabase
        .from('time_blockades')
        .insert({
          user_id: user.id,
          date: dateString,
          time_slot: timeSlot,
          reason: reason,
          description: options?.description
        });

      if (error) {
        console.error('Erro ao salvar bloqueio:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar bloqueio no banco de dados",
          variant: "destructive"
        });
        return;
      }

      // Atualizar estado local
      setManualBlockades(prev => {
        const newBlockades = { ...prev };
        newBlockades[blockadeKey] = {
          blocked: true,
          reason,
          description: options?.description,
          isRecurring: options?.isRecurring,
          endDate: options?.endDate ? format(options.endDate, 'yyyy-MM-dd') : undefined,
          isIndefinite: options?.isIndefinite,
          recurrenceType: options?.recurrenceType,
          originalDate: dateString
        };
        return newBlockades;
      });

      toast({
        title: "Sucesso",
        description: "Horário bloqueado com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao bloquear horário:', error);
      toast({
        title: "Erro",
        description: "Erro ao bloquear horário",
        variant: "destructive"
      });
    }
  }, [user?.id, toast]);

  // Função para gerar bloqueios recorrentes
  const generateRecurringBlockades = useCallback((
    startDate: Date,
    timeSlot: string,
    reason: string,
    recurrenceType: 'daily' | 'weekly' | 'monthly',
    endDate?: Date,
    isIndefinite?: boolean,
    description?: string
  ) => {
    const blockades: {[key: string]: any} = {};
    const maxDays = isIndefinite ? 365 : (endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 30);
    
    let currentDate = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < maxDays) {
      let nextDate: Date;
      
      switch (recurrenceType) {
        case 'daily':
          nextDate = new Date(currentDate);
          nextDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate = new Date(currentDate);
          nextDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate = new Date(currentDate);
          nextDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          nextDate = new Date(currentDate);
          nextDate.setDate(currentDate.getDate() + 7);
      }
      
      currentDate = nextDate;
      daysAdded++;
      
      // Verificar se passou da data limite
      if (endDate && currentDate > endDate) {
        break;
      }
      
      const dateString = format(currentDate, 'yyyy-MM-dd');
      const blockadeKey = `${dateString}-${timeSlot}`;
      
      blockades[blockadeKey] = {
        blocked: true,
        reason,
        description,
        isRecurring: true,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        isIndefinite,
        recurrenceType,
        originalDate: format(startDate, 'yyyy-MM-dd')
      };
    }
    
    return blockades;
  }, []);

  // Função para desbloquear um horário manualmente
  const unblockTimeSlot = useCallback(async (date: Date, timeSlot: string, removeAllFollowing: boolean = false) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    const dateString = format(date, 'yyyy-MM-dd');
    const blockadeKey = `${dateString}-${timeSlot}`;
    
    try {
      // Remover do banco de dados
      const { error } = await supabase
        .from('time_blockades')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateString)
        .eq('time_slot', timeSlot);

      if (error) {
        console.error('Erro ao remover bloqueio:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover bloqueio do banco de dados",
          variant: "destructive"
        });
        return;
      }

      // Atualizar estado local
      setManualBlockades(prev => {
        const newBlockades = { ...prev };
        delete newBlockades[blockadeKey];
        return newBlockades;
      });

      toast({
        title: "Sucesso",
        description: "Horário desbloqueado com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao desbloquear horário:', error);
      toast({
        title: "Erro",
        description: "Erro ao desbloquear horário",
        variant: "destructive"
      });
    }
  }, [user?.id, toast]);

  // Função para obter o motivo do bloqueio
  const getBlockadeReason = useCallback((date: Date, timeSlot: string): string | null => {
    const dateString = format(date, 'yyyy-MM-dd');
    const blockadeKey = `${dateString}-${timeSlot}`;
    return manualBlockades[blockadeKey]?.reason || null;
  }, [manualBlockades]);

  // Função para verificar se um bloqueio é recorrente
  const isRecurringBlockade = useCallback((date: Date, timeSlot: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const blockadeKey = `${dateString}-${timeSlot}`;
    return manualBlockades[blockadeKey]?.isRecurring || false;
  }, [manualBlockades]);

  // Função para obter informações completas do bloqueio
  const getBlockadeInfo = useCallback((date: Date, timeSlot: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const blockadeKey = `${dateString}-${timeSlot}`;
    return manualBlockades[blockadeKey] || null;
  }, [manualBlockades]);

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
    
    // Funções de bloqueio manual
    blockTimeSlot,
    unblockTimeSlot,
    getBlockadeReason,
    isRecurringBlockade,
    getBlockadeInfo,
    
    // Utilitários
    dayMapping
  };
};
