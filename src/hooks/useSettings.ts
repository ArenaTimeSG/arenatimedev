import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Settings, SettingsUpdate, DEFAULT_SETTINGS } from '@/types/settings';

// Função para garantir dados seguros
const getSafeSettings = (settings: Settings | null): Settings => {
  if (!settings) {
    return DEFAULT_SETTINGS;
  }

  return {
    modalities_enabled: settings.modalities_enabled || DEFAULT_SETTINGS.modalities_enabled,
    modalities_colors: settings.modalities_colors || DEFAULT_SETTINGS.modalities_colors,
    working_hours: settings.working_hours || DEFAULT_SETTINGS.working_hours,
    default_interval: settings.default_interval || DEFAULT_SETTINGS.default_interval,
    notifications_enabled: settings.notifications_enabled || DEFAULT_SETTINGS.notifications_enabled,
    theme: settings.theme || DEFAULT_SETTINGS.theme,
    personal_data: settings.personal_data || DEFAULT_SETTINGS.personal_data,
    online_enabled: settings.online_enabled ?? DEFAULT_SETTINGS.online_enabled,
    online_booking: settings.online_booking || DEFAULT_SETTINGS.online_booking,
  };
};

export const useSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Memoizar o userId para evitar re-renders desnecessários
  const userId = useMemo(() => user?.id, [user?.id]);

  // Query para buscar configurações do usuário
  const {
    data: rawSettings,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
    isError,
    isSuccess
  } = useQuery({
    queryKey: ['settings', userId],
    queryFn: async (): Promise<Settings> => {
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔍 Buscando configurações para usuário:', userId);

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum registro encontrado, criar configurações padrão
          console.log('📝 Criando configurações padrão para usuário:', userId);
          
          const defaultSettings = {
            ...DEFAULT_SETTINGS,
            personal_data: {
              ...DEFAULT_SETTINGS.personal_data,
              name: user?.user_metadata?.name || '',
              email: user?.email || '',
              phone: user?.user_metadata?.phone || ''
            }
          };

          const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert({
              user_id: userId,
              modalities_enabled: defaultSettings.modalities_enabled as any,
              modalities_colors: defaultSettings.modalities_colors as any,
              working_hours: defaultSettings.working_hours as any,
              default_interval: defaultSettings.default_interval,
              notifications_enabled: defaultSettings.notifications_enabled as any,
              theme: defaultSettings.theme,
              personal_data: defaultSettings.personal_data as any,
              online_enabled: defaultSettings.online_enabled,
              online_booking: defaultSettings.online_booking as any
            })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Erro ao criar configurações padrão:', insertError);
            throw insertError;
          }
          
          console.log('✅ Configurações padrão criadas com sucesso');
          return newSettings as unknown as Settings;
        }
        console.error('❌ Erro ao buscar configurações:', error);
        throw error;
      }

      console.log('✅ Configurações carregadas com sucesso');
      return data as unknown as Settings;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // Não tentar novamente para evitar loops
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false,
  });

  // Garantir que settings sempre seja seguro
  const settings = useMemo(() => getSafeSettings(rawSettings), [rawSettings]);

  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: SettingsUpdate): Promise<Settings> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('💾 Salvando configurações:', updates);

      const { data, error } = await supabase
        .from('settings')
        .update(updates as any)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar configurações:', error);
        throw error;
      }

      console.log('✅ Configurações salvas com sucesso');
      return data as unknown as Settings;
    },
    onSuccess: (data) => {
      // Atualizar o cache
      queryClient.setQueryData(['settings', user?.id], data);
      
      toast({
        title: 'Configurações salvas!',
        description: 'Suas configurações foram atualizadas com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutation:', error);
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    },
  });

  // Função para atualizar configurações (memoizada)
  const updateSettings = useCallback(async (updates: SettingsUpdate) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      await updateSettingsMutation.mutateAsync(updates as any);
    } finally {
      setIsLoading(false);
    }
  }, [userId, updateSettingsMutation]);

  // Função para atualizar modalidades habilitadas (memoizada)
  const updateModalitiesEnabled = useCallback(async (modalities_enabled: Record<string, boolean>) => {
    console.log('🔄 Atualizando modalidades habilitadas:', modalities_enabled);
    await updateSettings({ modalities_enabled });
  }, [updateSettings]);

  // Função para atualizar cores das modalidades (memoizada)
  const updateModalitiesColors = useCallback(async (modalities_colors: Record<string, string>) => {
    console.log('🎨 Atualizando cores das modalidades:', modalities_colors);
    await updateSettings({ modalities_colors });
  }, [updateSettings]);

  // Função para atualizar intervalo padrão (memoizada)
  const updateDefaultInterval = useCallback(async (default_interval: number) => {
    console.log('⏰ Atualizando intervalo padrão:', default_interval);
    await updateSettings({ default_interval });
  }, [updateSettings]);

  // Função para atualizar notificações (memoizada)
  const updateNotifications = useCallback(async (notifications_enabled: Settings['notifications_enabled']) => {
    console.log('🔔 Atualizando notificações:', notifications_enabled);
    await updateSettings({ notifications_enabled });
  }, [updateSettings]);

  // Função para atualizar dados pessoais (memoizada)
  const updatePersonalData = useCallback(async (personal_data: Settings['personal_data']) => {
    console.log('👤 Atualizando dados pessoais:', personal_data);
    await updateSettings({ personal_data });
  }, [updateSettings]);

  // Função para atualizar tema (memoizada)
  const updateTheme = useCallback(async (theme: Settings['theme']) => {
    console.log('🎨 Atualizando tema:', theme);
    await updateSettings({ theme });
  }, [updateSettings]);

  // Função para resetar configurações para padrão (memoizada)
  const resetToDefaults = useCallback(async () => {
    if (!userId || !user) return;

    const defaultSettings = {
      ...DEFAULT_SETTINGS,
      personal_data: {
        ...DEFAULT_SETTINGS.personal_data,
        name: user.user_metadata?.name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || ''
      }
    };

    console.log('🔄 Resetando para configurações padrão');
    await updateSettings(defaultSettings);
  }, [userId, user, updateSettings]);

  // Função para obter modalidades ativas (memoizada)
  const getActiveModalities = useCallback(() => {
    if (!settings) return [];
    
    return Object.entries(settings.modalities_enabled || {})
      .filter(([_, enabled]) => enabled)
      .map(([modality, _]) => modality);
  }, [settings]);

  // Função para buscar modalidades personalizadas
  const getCustomModalities = useCallback(async () => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('custom_modalities')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar modalidades personalizadas:', error);
      return [];
    }
  }, [userId]);

  // Função para obter cor de uma modalidade (memoizada)
  const getModalityColor = useCallback((modality: string) => {
    if (!settings) return '#3b82f6'; // cor padrão
    return settings.modalities_colors?.[modality] || '#3b82f6';
  }, [settings]);

  // Função para verificar se uma modalidade está ativa (memoizada)
  const isModalityActive = useCallback((modality: string) => {
    if (!settings) return false;
    return settings.modalities_enabled?.[modality] || false;
  }, [settings]);

  // Função para atualizar horários de trabalho (memoizada)
  const updateWorkingHours = useCallback(async (day: string, schedule: any) => {
    if (!settings) return;
    
    console.log('🕐 Atualizando horários para', day, ':', schedule);
    
    const updatedWorkingHours = {
      ...settings.working_hours,
      [day]: schedule
    };
    
    await updateSettings({ working_hours: updatedWorkingHours });
  }, [updateSettings, settings]);

  // Função para validar horários de trabalho (memoizada)
  const validateSchedule = useCallback((schedule: any): boolean => {
    if (!settings) return false;
    
    for (const [day, daySchedule] of Object.entries(schedule)) {
      const scheduleData = daySchedule as any;
      if (scheduleData?.enabled) {
        const start = scheduleData.start;
        const end = scheduleData.end;
        
        if (start >= end) {
          toast({
            title: 'Horário inválido',
            description: `Horário inválido para ${day}: início deve ser menor que fim.`,
            variant: 'destructive',
          });
          return false;
        }
      }
    }
    return true;
  }, [settings, toast]);

  // Função para atualizar o horário completo (memoizada)
  const updateSchedule = useCallback(async (schedule: any) => {
    console.log('📅 Atualizando horário completo:', schedule);
    await updateSettings({ working_hours: schedule });
  }, [updateSettings]);

  // Função para obter horários de trabalho (memoizada)
  const getWorkingHours = useCallback((day: string) => {
    if (!settings) return null;
    return settings.working_hours?.[day] || null;
  }, [settings]);

  // Função para verificar se um dia está habilitado (memoizada)
  const isDayEnabled = useCallback((day: string) => {
    if (!settings) return false;
    return settings.working_hours?.[day]?.enabled || false;
  }, [settings]);

  // Memoizar o retorno para evitar re-renders desnecessários
  const returnValue = useMemo(() => ({
    // Data - sempre seguro
    settings: settings,
    
    // Loading states
    isLoading: isQueryLoading || isLoading,
    isSaving: updateSettingsMutation.isPending,
    
    // Error states
    error: queryError,
    isError,
    isSuccess,
    
    // Actions
    updateSettings,
    updateModalitiesEnabled,
    updateModalitiesColors,
    updateDefaultInterval,
    updateNotifications,
    updatePersonalData,
    updateTheme,
    resetToDefaults,
    refetch,
    
    // Utilities
    getActiveModalities,
    getCustomModalities,
    getModalityColor,
    isModalityActive,
    updateWorkingHours,
    validateSchedule,
    updateSchedule,
    getWorkingHours,
    isDayEnabled,
  }), [
    settings,
    isQueryLoading,
    isLoading,
    updateSettingsMutation.isPending,
    queryError,
    isError,
    isSuccess,
    updateSettings,
    updateModalitiesEnabled,
    updateModalitiesColors,
    updateDefaultInterval,
    updateNotifications,
    updatePersonalData,
    updateTheme,
    resetToDefaults,
    refetch,
    getActiveModalities,
    getCustomModalities,
    getModalityColor,
    isModalityActive,
    updateWorkingHours,
    validateSchedule,
    updateSchedule,
    getWorkingHours,
    isDayEnabled,
  ]);

  return returnValue;
};
