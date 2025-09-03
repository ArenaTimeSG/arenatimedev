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
      const { data, error } = await (supabase as any)
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
         // Garante que o time_slot esteja no formato HH:MM para consistência
         const formattedTimeSlot = (blockade.time_slot as string).substring(0, 5);
         const blockadeKey = `${blockade.date}-${formattedTimeSlot}`;
         blockadesMap[blockadeKey] = {
           blocked: true,
           reason: blockade.reason,
           description: blockade.description,
           isRecurring: false, // Será detectado automaticamente
           originalDate: blockade.date
         };
       });
       
       // Detectar bloqueios recorrentes baseado em múltiplos horários iguais
       const timeSlotCounts: {[timeSlot: string]: number} = {};
       data?.forEach(blockade => {
         const timeSlot = (blockade.time_slot as string).substring(0, 5);
         timeSlotCounts[timeSlot] = (timeSlotCounts[timeSlot] || 0) + 1;
       });
       
       // Marcar como recorrentes os bloqueios que têm múltiplas ocorrências
       Object.entries(blockadesMap).forEach(([key, blockade]) => {
         const timeSlot = key.split('-')[1]; // Extrair horário da chave
         if (timeSlotCounts[timeSlot] > 1) {
           blockade.isRecurring = true;
         }
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

    const daySchedule = settings.working_hours[dayKey] as any;
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

    const daySchedule = settings.working_hours[dayKey] as any;
    
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
      if ((daySchedule as any)?.enabled) {
        const startHour = parseInt((daySchedule as any).start.split(':')[0]);
        let endHour = parseInt((daySchedule as any).end.split(':')[0]);
        
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

    const startHour = parseInt((daySchedule as any).start.split(':')[0]);
    let endHour = parseInt((daySchedule as any).end.split(':')[0]);
    
    // Se end_time = 00:00, tratar como 23:59
    if (endHour === 0) {
      endHour = 23;
    }
    
    const availableHours: string[] = [];
    
    // Verificar se o funcionamento atravessa a madrugada
    // Se o horário original termina às 00:00, não atravessa a madrugada (é fim do dia)
    const originalEndHour = parseInt((daySchedule as any).end.split(':')[0]);
    const originalEndMinutes = parseInt((daySchedule as any).end.split(':')[1] || '0');
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
    
    // Para bloqueios recorrentes, SEMPRE usar a data selecionada pelo usuário
    // Não alterar a data base - deixar o usuário escolher
    let effectiveStartDate = startDate;
    
    console.log('🔍 Usando data selecionada pelo usuário:', format(startDate, 'yyyy-MM-dd'));
    console.log('🔍 Data atual:', format(new Date(), 'yyyy-MM-dd'));
    
    // Incluir o bloqueio inicial
    const startDateString = format(effectiveStartDate, 'yyyy-MM-dd');
    const startBlockadeKey = `${startDateString}-${timeSlot}`;
    blockades[startBlockadeKey] = {
      blocked: true,
      reason,
      description,
      isRecurring: true,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      isIndefinite,
      recurrenceType,
      originalDate: startDateString
    };

    // Se não for indefinido e não tiver data limite, usar limite padrão
    let effectiveEndDate = endDate;
    if (!isIndefinite && !endDate) {
      effectiveEndDate = new Date(effectiveStartDate);
      effectiveEndDate.setDate(effectiveEndDate.getDate() + 365); // Limite de 1 ano
    }

    // Calcular número máximo de repetições
    const maxDays = isIndefinite ? 365 : (effectiveEndDate ? Math.ceil((effectiveEndDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)) : 30);
    
    let currentDate = new Date(effectiveStartDate);
    let daysAdded = 0;
    
    console.log('🔍 Gerando bloqueios recorrentes a partir de:', format(effectiveStartDate, 'yyyy-MM-dd'));
    console.log('🔍 Tipo de recorrência:', recurrenceType);
    console.log('🔍 Data limite:', effectiveEndDate ? format(effectiveEndDate, 'yyyy-MM-dd') : 'Indefinido');
    
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
      if (effectiveEndDate && currentDate > effectiveEndDate) {
        break;
      }
      
      const dateString = format(currentDate, 'yyyy-MM-dd');
      const blockadeKey = `${dateString}-${timeSlot}`;
      
      blockades[blockadeKey] = {
        blocked: true,
        reason,
        description,
        isRecurring: true,
        endDate: effectiveEndDate ? format(effectiveEndDate, 'yyyy-MM-dd') : undefined,
        isIndefinite,
        recurrenceType,
        originalDate: startDateString
      };
    }
    
    console.log('🔍 Total de bloqueios gerados:', Object.keys(blockades).length);
    console.log('🔍 Primeiro bloqueio:', Object.keys(blockades)[0]);
    console.log('🔍 Último bloqueio:', Object.keys(blockades)[Object.keys(blockades).length - 1]);
    
    return blockades;
  }, []);

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

    try {
      if (options?.isRecurring && options?.recurrenceType) {
        // Gerar bloqueios recorrentes
        const recurringBlockades = generateRecurringBlockades(
          date,
          timeSlot,
          reason,
          options.recurrenceType,
          options.endDate,
          options.isIndefinite,
          options.description
        );

        console.log('🔍 Bloqueios recorrentes gerados:', recurringBlockades);

        // Salvar todos os bloqueios recorrentes no banco de dados
        const blockadeData = Object.entries(recurringBlockades).map(([key, blockade]) => {
          // O key tem formato "2025-01-27-10:00", precisamos extrair apenas a data (2025-01-27)
          const parts = key.split('-');
          const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
          const blockadeInfo = blockade as any;
          
          console.log('🔍 Processando key:', key, 'parts:', parts, 'dateStr:', dateStr);
          
          return {
            user_id: user.id,
            date: dateStr,
            time_slot: timeSlot,
            reason: blockadeInfo.reason,
            description: blockadeInfo.description || null
          };
        });

        console.log('🔍 Dados para inserção no banco:', blockadeData);

        // Inserir um por vez para evitar problemas de validação
        let insertedCount = 0;
        let skippedCount = 0;
        
        for (const blockade of blockadeData) {
          console.log('🔍 Tentando inserir bloqueio:', blockade);
          
          // Validar dados antes de enviar
          if (!blockade.user_id || !blockade.date || !blockade.time_slot || !blockade.reason) {
            console.error('❌ Dados inválidos para inserção:', blockade);
            throw new Error('Dados inválidos para inserção no banco');
          }
          
          // Verificar se a data está no formato correto
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(blockade.date)) {
            console.error('❌ Formato de data inválido:', blockade.date);
            throw new Error('Formato de data inválido');
          }
          
          // Verificar se o time_slot está no formato correto
          const timeRegex = /^\d{2}:\d{2}$/;
          if (!timeRegex.test(blockade.time_slot)) {
            console.error('❌ Formato de horário inválido:', blockade.time_slot);
            throw new Error('Formato de horário inválido');
          }
          
          // Verificar se o bloqueio já existe antes de inserir
          const { data: existingBlockade, error: checkError } = await (supabase as any)
            .from('time_blockades')
            .select('id')
            .eq('user_id', blockade.user_id)
            .eq('date', blockade.date)
            .eq('time_slot', blockade.time_slot)
            .single();
          
          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = "no rows returned"
            console.error('❌ Erro ao verificar bloqueio existente:', checkError);
            throw checkError;
          }
          
          if (existingBlockade) {
            console.log('⚠️ Bloqueio já existe, pulando inserção:', blockade);
            skippedCount++;
            continue; // Pular este bloqueio e continuar com o próximo
          }
          
          console.log('🔍 Dados validados, enviando para o Supabase...');
          
          const { error } = await (supabase as any)
            .from('time_blockades')
            .insert(blockade);

          if (error) {
            console.error('❌ Erro ao salvar bloqueio individual:', error);
            console.error('❌ Dados do bloqueio que falhou:', blockade);
            console.error('❌ Tipo de erro:', typeof error);
            console.error('❌ Mensagem de erro:', error.message);
            console.error('❌ Código de erro:', error.code);
            console.error('❌ Detalhes do erro:', error.details);
            throw error;
          } else {
            console.log('✅ Bloqueio inserido com sucesso:', blockade);
            insertedCount++;
          }
        }

        // Atualizar estado local com todos os bloqueios recorrentes
        setManualBlockades(prev => {
          const newBlockades = { ...prev };
          Object.entries(recurringBlockades).forEach(([key, blockade]) => {
            newBlockades[key] = {
              ...blockade,
              isRecurring: true, // Marcar explicitamente como recorrente
              recurrenceType: options.recurrenceType,
              endDate: options.endDate ? format(options.endDate, 'yyyy-MM-dd') : undefined,
              isIndefinite: options.isIndefinite
            };
          });
          return newBlockades;
        });

        // Usar as variáveis já declaradas no loop
        let message = `${insertedCount} horários foram bloqueados recorrentemente!`;
        if (skippedCount > 0) {
          message += ` (${skippedCount} já existiam e foram pulados)`;
        }

        toast({
          title: "Sucesso",
          description: message,
        });
      } else {
        // Bloqueio único
        const dateString = format(date, 'yyyy-MM-dd');
        const blockadeKey = `${dateString}-${timeSlot}`;
        
        // Salvar no banco de dados
        const { error } = await (supabase as any)
          .from('time_blockades')
          .insert({
            user_id: user.id,
            date: dateString,
            time_slot: timeSlot,
            reason: reason,
            description: options?.description || null
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
            isRecurring: false
          };
          return newBlockades;
        });

        toast({
          title: "Sucesso",
          description: "Horário bloqueado com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao bloquear horário:', error);
      toast({
        title: "Erro",
        description: "Erro ao bloquear horário",
        variant: "destructive"
      });
    }
  }, [user?.id, toast, generateRecurringBlockades]);

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
      if (removeAllFollowing) {
        // Desbloquear toda a recorrência
        console.log('🔍 Desbloqueando toda a recorrência para:', timeSlot);
        
        // Buscar todos os bloqueios com o mesmo horário
        const { data: allBlockades, error: fetchError } = await (supabase as any)
          .from('time_blockades')
          .select('*')
          .eq('user_id', user.id)
          .eq('time_slot', timeSlot)
          .gte('date', dateString); // A partir da data selecionada
        
        if (fetchError) {
          console.error('Erro ao buscar bloqueios para remoção:', fetchError);
          toast({
            title: "Erro",
            description: "Erro ao buscar bloqueios para remoção",
            variant: "destructive"
          });
          return;
        }
        
        if (allBlockades && allBlockades.length > 0) {
          console.log('🔍 Encontrados', allBlockades.length, 'bloqueios para remover');
          
          // Remover todos os bloqueios encontrados
          const { error: deleteError } = await (supabase as any)
            .from('time_blockades')
            .delete()
            .eq('user_id', user.id)
            .eq('time_slot', timeSlot)
            .gte('date', dateString);
          
          if (deleteError) {
            console.error('Erro ao remover bloqueios recorrentes:', deleteError);
            toast({
              title: "Erro",
              description: "Erro ao remover bloqueios recorrentes",
              variant: "destructive"
            });
            return;
          }
          
          // Atualizar estado local removendo todos os bloqueios
          setManualBlockades(prev => {
            const newBlockades = { ...prev };
            allBlockades.forEach(blockade => {
              const key = `${blockade.date}-${blockade.time_slot}`;
              delete newBlockades[key];
            });
            return newBlockades;
          });
          
          toast({
            title: "Sucesso",
            description: `${allBlockades.length} bloqueios recorrentes foram removidos!`,
          });
        } else {
          toast({
            title: "Aviso",
            description: "Nenhum bloqueio recorrente encontrado para remover",
            variant: "default"
          });
        }
      } else {
        // Desbloquear apenas o horário específico
        const { error } = await (supabase as any)
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
      }

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

  // Função para verificar se um bloqueio é recorrente (versão síncrona para UI)
  const isRecurringBlockade = useCallback((date: Date, timeSlot: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const blockadeKey = `${dateString}-${timeSlot}`;
    
    // Verificar se existe um bloqueio neste horário
    const blockade = manualBlockades[blockadeKey];
    if (!blockade) return false;
    
    // Verificar se é recorrente baseado no estado local
    // Se temos múltiplos bloqueios com o mesmo horário, é recorrente
    const allBlockadesForTimeSlot = Object.entries(manualBlockades).filter(([key, value]) => {
      const [blockadeDate, blockadeTime] = key.split('-');
      return blockadeTime === timeSlot && value.blocked;
    });
    
    console.log('🔍 Verificando recorrência para:', timeSlot, 'encontrados:', allBlockadesForTimeSlot.length, 'bloqueios no estado local');
    
    // Se há mais de 1 bloqueio com o mesmo horário, é recorrente
    return allBlockadesForTimeSlot.length > 1;
  }, [manualBlockades]);

  // Função para verificar se um bloqueio é recorrente baseado no banco de dados
  const isRecurringBlockadeFromDB = useCallback(async (date: Date, timeSlot: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      // Buscar no banco de dados todos os bloqueios com o mesmo horário
      const { data: allBlockades, error } = await (supabase as any)
        .from('time_blockades')
        .select('date')
        .eq('user_id', user.id)
        .eq('time_slot', timeSlot);
      
      if (error) {
        console.error('Erro ao verificar recorrência no banco:', error);
        return false;
      }
      
      console.log('🔍 Verificando recorrência no banco para:', timeSlot, 'encontrados:', allBlockades?.length || 0, 'bloqueios');
      
      // Se há mais de 1 bloqueio com o mesmo horário, é recorrente
      return (allBlockades?.length || 0) > 1;
    } catch (error) {
      console.error('Erro ao verificar recorrência no banco:', error);
      return false;
    }
  }, [user?.id]);

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
    isRecurringBlockadeFromDB,
    getBlockadeInfo,
    
    // Utilitários
    dayMapping
  };
};
