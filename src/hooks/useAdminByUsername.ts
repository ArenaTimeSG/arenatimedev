import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminSettings {
  working_hours: {
    monday: { enabled: boolean; start: string; end: string };
    tuesday: { enabled: boolean; start: string; end: string };
    wednesday: { enabled: boolean; start: string; end: string };
    thursday: { enabled: boolean; start: string; end: string };
    friday: { enabled: boolean; start: string; end: string };
    saturday: { enabled: boolean; start: string; end: string };
    sunday: { enabled: boolean; start: string; end: string };
  };
  online_booking: {
    ativo: boolean;
    auto_agendar: boolean;
    tempo_minimo_antecedencia: number;
    duracao_padrao: number;
  };
}

interface AdminData {
  user: AdminUser;
  settings: AdminSettings;
  modalities: Array<{
    id: string;
    name: string;
    valor: number;
  }>;
}

export const useAdminByUsername = (username: string) => {
  return useQuery({
    queryKey: ['adminByUsername', username],
    queryFn: async (): Promise<AdminData> => {
      try {
        // 1. Buscar o usuário pelo username
        console.log('Buscando usuário com username:', username);
        
        const { data: user, error: userError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', username)
          .eq('is_active', true)
          .single();
        
        if (userError || !user) {
          console.error('Usuário não encontrado para username:', username);
          throw new Error('Usuário não encontrado');
        }
        
        console.log('Usuário encontrado:', user);

        // 2. Buscar configurações do usuário
        const { data: settings, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.user_id)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw new Error('Erro ao carregar configurações');
        }

        // 3. Buscar modalidades do usuário
        const { data: modalities, error: modalitiesError } = await supabase
          .from('modalities')
          .select('*')
          .eq('user_id', user.user_id)
          .order('name');

        if (modalitiesError) {
          console.error('Erro ao carregar modalidades:', modalitiesError);
          throw new Error('Erro ao carregar modalidades');
        }

        console.log('Modalidades encontradas:', modalities);

        // Configurações padrão se não existirem
        const defaultSettings: AdminSettings = {
          working_hours: {
            monday: { enabled: true, start: '08:00', end: '18:00' },
            tuesday: { enabled: true, start: '08:00', end: '18:00' },
            wednesday: { enabled: true, start: '08:00', end: '18:00' },
            thursday: { enabled: true, start: '08:00', end: '18:00' },
            friday: { enabled: true, start: '08:00', end: '18:00' },
            saturday: { enabled: true, start: '08:00', end: '18:00' },
            sunday: { enabled: false, start: '08:00', end: '18:00' }
          },
          online_booking: {
            ativo: true,
            auto_agendar: false,
            tempo_minimo_antecedencia: 24,
            duracao_padrao: 60
          }
        };

        // Se não há configurações, usar as padrão
        // Se há configurações mas não tem online_booking, adicionar
        const finalSettings = settings ? {
          ...defaultSettings,
          ...settings,
          online_booking: {
            ...defaultSettings.online_booking,
            ...(settings.online_booking || {})
          }
        } : defaultSettings;

        return {
          user,
          settings: finalSettings,
          modalities: modalities || []
        };
      } catch (error) {
        console.error('Erro ao buscar admin por username:', error);
        throw error;
      }
    },
    enabled: !!username,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
