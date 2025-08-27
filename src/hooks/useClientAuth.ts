import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, CreateClientData, LoginClientData, UpdateClientData } from '@/types/client';

// Função para hash simples da senha (em produção, usar bcrypt)
const hashPassword = (password: string): string => {
  return btoa(password); // Base64 para demo - NÃO usar em produção
};

// Função para verificar senha
const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export const useClientAuth = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se há cliente logado no localStorage
  useEffect(() => {
    const checkSavedClient = async () => {
      const savedClient = localStorage.getItem('client');
      if (savedClient) {
        try {
          const parsedClient = JSON.parse(savedClient);
          // Verificar se o cliente ainda é válido (tem id e email)
          if (parsedClient && parsedClient.id && parsedClient.email) {
            // Definir o cliente imediatamente para evitar flash de loading
            setClient(parsedClient);
            // Verificar se o cliente ainda existe no banco em background
            verifyClientExists(parsedClient.id, parsedClient.email);
          } else {
            localStorage.removeItem('client');
            setClient(null);
          }
        } catch (error) {
          console.error('Erro ao parsear cliente do localStorage:', error);
          localStorage.removeItem('client');
          setClient(null);
        }
      }
      setLoading(false);
    };

    checkSavedClient();
  }, []);

  // Verificar se o cliente ainda existe no banco
  const verifyClientExists = async (clientId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('booking_clients')
        .select('id, name, email, phone')
        .eq('id', clientId)
        .eq('email', email)
        .single();

      if (error || !data) {
        console.log('Cliente não encontrado no banco, removendo do localStorage');
        localStorage.removeItem('client');
        setClient(null);
        return false;
      }

      // Atualizar dados do cliente caso tenha mudanças
      if (JSON.stringify(data) !== localStorage.getItem('client')) {
        saveClientToStorage(data);
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar cliente no banco:', error);
      return false;
    }
  };

  // Listener para sincronizar mudanças no localStorage entre abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'client') {
        if (e.newValue) {
          try {
            const parsedClient = JSON.parse(e.newValue);
            setClient(parsedClient);
          } catch (error) {
            console.error('Erro ao parsear cliente do storage event:', error);
            setClient(null);
          }
        } else {
          setClient(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Listener para manter sessão ao recarregar página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Garantir que o cliente seja salvo antes de recarregar
      if (client) {
        localStorage.setItem('client', JSON.stringify(client));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [client]);

  // Salvar cliente no localStorage
  const saveClientToStorage = (clientData: Client) => {
    localStorage.setItem('client', JSON.stringify(clientData));
    setClient(clientData);
  };

  // Remover cliente do localStorage
  const removeClientFromStorage = () => {
    localStorage.removeItem('client');
    setClient(null);
  };

  // Mutation para registrar cliente
  const registerMutation = useMutation({
    mutationFn: async (data: CreateClientData) => {
      const { data: existingClient } = await supabase
        .from('booking_clients')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingClient) {
        throw new Error('Email já cadastrado');
      }

      const hashedPassword = hashPassword(data.password);
      
      console.log('🔍 useClientAuth: Tentando registrar cliente:', { name: data.name, email: data.email, phone: data.phone });
      
      const { data: newClient, error } = await supabase
        .from('booking_clients')
        .insert({
          name: data.name,
          email: data.email,
          password_hash: hashedPassword,
          phone: data.phone
        })
        .select('id, name, email, phone, created_at')
        .single();

      if (error) {
        console.error('❌ useClientAuth: Erro ao registrar cliente:', error);
        throw error;
      }
      
      console.log('✅ useClientAuth: Cliente registrado com sucesso:', newClient);
      return newClient;
    },
    onSuccess: (data) => {
      saveClientToStorage(data);
    }
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (data: LoginClientData) => {
      const { data: client, error } = await supabase
        .from('booking_clients')
        .select('*')
        .eq('email', data.email)
        .single();

      if (error || !client) {
        throw new Error('Email ou senha incorretos');
      }

      if (!verifyPassword(data.password, client.password_hash)) {
        throw new Error('Email ou senha incorretos');
      }

      return client;
    },
    onSuccess: (data) => {
      saveClientToStorage(data);
    }
  });

  // Mutation para atualizar cliente
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateClientData) => {
      if (!client) throw new Error('Cliente não autenticado');

      const { data: updatedClient, error } = await supabase
        .from('booking_clients')
        .update(data)
        .eq('id', client.id)
        .select()
        .single();

      if (error) throw error;
      return updatedClient;
    },
    onSuccess: (data) => {
      saveClientToStorage(data);
    }
  });

  // Função para logout
  const logout = () => {
    removeClientFromStorage();
  };

  return {
    client,
    loading,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    update: updateMutation.mutate,
    logout,
    verifyClientExists,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isUpdating: updateMutation.isPending,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
    updateError: updateMutation.error
  };
};
