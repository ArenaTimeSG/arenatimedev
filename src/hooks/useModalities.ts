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

export const useModalities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Query para buscar modalidades do usuário
  const {
    data: modalities = [],
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['modalities', user?.id],
    queryFn: async (): Promise<Modality[]> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('modalities')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar modalidades:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Mutation para criar modalidade
  const createModalityMutation = useMutation({
    mutationFn: async (modalityData: CreateModalityData): Promise<Modality> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('modalities')
        .insert({
          name: modalityData.name,
          valor: modalityData.valor,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar modalidade:', error);
        throw error;
      }

      return data;
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

      const { data: updatedModality, error } = await supabase
        .from('modalities')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar modalidade:', error);
        throw error;
      }

      return updatedModality;
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

      const { error } = await supabase
        .from('modalities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erro ao deletar modalidade:', error);
        throw error;
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

