import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Modality {
  id: string;
  user_id: string;
  name: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

export interface CreateModalityData {
  name: string;
  valor: number;
}

export interface UpdateModalityData {
  name?: string;
  valor?: number;
}

export const useModalities = (adminUserId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Se adminUserId foi fornecido, usar ele, senão usar o user.id
  const userId = adminUserId || user?.id;

  // Query para buscar modalidades do usuário
  const {
    data: modalities = [],
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['modalities', userId],
    queryFn: async (): Promise<Modality[]> => {
      try {
        if (!userId) {
          console.log('❌ useModalities: userId não fornecido');
          return [];
        }

        console.log('🔍 useModalities: Buscando modalidades para userId:', userId);

        // Usar fetch direto para contornar problemas de tipos
        const url = `${(supabase as any).supabaseUrl}/rest/v1/modalities?user_id=eq.${userId}&select=*&order=name.asc`;
        console.log('🔍 useModalities: URL da requisição:', url);
        
        const response = await fetch(url, {
          headers: {
            'apikey': (supabase as any).supabaseKey,
            'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
            'Content-Type': 'application/json',
          }
        });

        console.log('🔍 useModalities: Status da resposta:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ useModalities: Erro na resposta:', errorText);
          throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ useModalities: Modalidades encontradas:', data);
        console.log('✅ useModalities: Quantidade de modalidades:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('❌ useModalities: Erro ao buscar modalidades:', error);
        return [];
      }
    },
    enabled: !!userId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar modalidade
  const createModalityMutation = useMutation({
    mutationFn: async (modalityData: CreateModalityData): Promise<Modality> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${(supabase as any).supabaseUrl}/rest/v1/modalities`, {
        method: 'POST',
        headers: {
          'apikey': (supabase as any).supabaseKey,
          'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: modalityData.name,
          valor: modalityData.valor,
          user_id: user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar modalidade');
      }

      const data = await response.json();
      return data[0];
    },
    onSuccess: (newModality) => {
      toast({
        title: 'Modalidade criada!',
        description: `${newModality.name} foi adicionada com sucesso.`,
      });
      
      // Invalidate and refetch modalities
      queryClient.invalidateQueries({ queryKey: ['modalities', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar modalidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar modalidade
  const updateModalityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateModalityData }): Promise<Modality> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${(supabase as any).supabaseUrl}/rest/v1/modalities?id=eq.${id}&user_id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': (supabase as any).supabaseKey,
          'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar modalidade');
      }

      const responseData = await response.json();
      return responseData[0];
    },
    onSuccess: (updatedModality) => {
      toast({
        title: 'Modalidade atualizada!',
        description: `${updatedModality.name} foi atualizada com sucesso.`,
      });
      
      // Invalidate and refetch modalities
      queryClient.invalidateQueries({ queryKey: ['modalities', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar modalidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para deletar modalidade
  const deleteModalityMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${(supabase as any).supabaseUrl}/rest/v1/modalities?id=eq.${id}&user_id=eq.${user.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': (supabase as any).supabaseKey,
          'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar modalidade');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Modalidade removida!',
        description: 'Modalidade foi removida com sucesso.',
      });
      
      // Invalidate and refetch modalities
      queryClient.invalidateQueries({ queryKey: ['modalities', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover modalidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Funções de conveniência
  const createModality = useCallback(async (data: CreateModalityData) => {
    setIsLoading(true);
    try {
      await createModalityMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  }, [createModalityMutation]);

  const updateModality = useCallback(async (id: string, data: UpdateModalityData) => {
    setIsLoading(true);
    try {
      await updateModalityMutation.mutateAsync({ id, data });
    } finally {
      setIsLoading(false);
    }
  }, [updateModalityMutation]);

  const deleteModality = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await deleteModalityMutation.mutateAsync(id);
    } finally {
      setIsLoading(false);
    }
  }, [deleteModalityMutation]);

  return {
    // Data
    modalities,
    
    // Loading states
    isLoading: isLoading || isQueryLoading,
    isCreating: createModalityMutation.isPending,
    isUpdating: updateModalityMutation.isPending,
    isDeleting: deleteModalityMutation.isPending,
    
    // Error states
    error: queryError,
    
    // Actions
    createModality,
    updateModality,
    deleteModality,
    refetch,
  };
};

