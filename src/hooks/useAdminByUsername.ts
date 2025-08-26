import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getAdminDataForBooking } from '@/api/check-online-booking';

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
        
        const adminData = await getAdminDataForBooking(username);
        
        console.log('✅ useAdminByUsername: Dados do admin carregados com sucesso:', adminData);
        
        return adminData as AdminData;
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
