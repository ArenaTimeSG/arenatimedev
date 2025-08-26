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
    const savedClient = localStorage.getItem('client');
    if (savedClient) {
      try {
        setClient(JSON.parse(savedClient));
      } catch (error) {
        localStorage.removeItem('client');
      }
    }
    setLoading(false);
  }, []);

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
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isUpdating: updateMutation.isPending,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
    updateError: updateMutation.error
  };
};
