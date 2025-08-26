import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
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
  online_enabled: boolean;
  online_booking: {
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
        if (!username) {
          throw new Error('Username é obrigatório');
        }

        console.log('🔍 useAdminByUsername: Buscando admin com username:', username);

        // 1. Buscar o usuário pelo username
        const userResponse = await fetch(`${(supabase as any).supabaseUrl}/rest/v1/user_profiles?username=eq.${username}&is_active=eq.true&select=*`, {
          headers: {
            'apikey': (supabase as any).supabaseKey,
            'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
            'Content-Type': 'application/json',
          }
        });

        if (!userResponse.ok) {
          throw new Error('Erro ao buscar usuário');
        }

        const users = await userResponse.json();
        if (!users || users.length === 0) {
          throw new Error('Usuário não encontrado');
        }

        const user = users[0];
        console.log('✅ useAdminByUsername: Usuário encontrado:', user);

        // 2. Buscar configurações do usuário
        const settingsResponse = await fetch(`${(supabase as any).supabaseUrl}/rest/v1/settings?user_id=eq.${user.user_id}&select=*`, {
          headers: {
            'apikey': (supabase as any).supabaseKey,
            'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
            'Content-Type': 'application/json',
          }
        });

        let settings = null;
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          settings = settingsData[0] || null;
        }

        // Configurações padrão
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
          online_enabled: false,
          online_booking: {
            auto_agendar: false,
            tempo_minimo_antecedencia: 24,
            duracao_padrao: 60
          }
        };

        // Combinar configurações existentes com padrão
        const finalSettings: AdminSettings = {
          ...defaultSettings,
          online_enabled: settings?.online_enabled ?? false,
          working_hours: settings?.working_hours || defaultSettings.working_hours,
          online_booking: settings?.online_booking || defaultSettings.online_booking
        };

        console.log('✅ useAdminByUsername: Configurações carregadas:', finalSettings);

        // 3. Buscar modalidades do usuário
        const modalitiesResponse = await fetch(`${(supabase as any).supabaseUrl}/rest/v1/modalities?user_id=eq.${user.user_id}&select=*&order=name.asc`, {
          headers: {
            'apikey': (supabase as any).supabaseKey,
            'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
            'Content-Type': 'application/json',
          }
        });

        let modalities = [];
        if (modalitiesResponse.ok) {
          modalities = await modalitiesResponse.json();
        }

        console.log('✅ useAdminByUsername: Modalidades encontradas:', modalities);
        console.log('✅ useAdminByUsername: Quantidade de modalidades:', modalities?.length || 0);

        return {
          user: user as AdminUser,
          settings: finalSettings,
          modalities: modalities || []
        };

      } catch (error) {
        console.error('❌ useAdminByUsername: Erro:', error);
        throw error;
      }
    },
    enabled: !!username,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
