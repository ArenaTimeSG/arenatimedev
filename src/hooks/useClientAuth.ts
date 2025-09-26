import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, CreateClientData, LoginClientData, UpdateClientData } from '@/types/client';

// Função para gerar token de sessão único
const generateSessionToken = (): string => {
  return btoa(Date.now().toString() + Math.random().toString(36).substr(2, 9));
};

// Função para obter informações do dispositivo
const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timestamp: new Date().toISOString()
  };
};

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

  // Verificar se há cliente logado via sessão
  useEffect(() => {
    const checkSavedClient = async () => {
      const sessionToken = localStorage.getItem('client_session_token');
      if (sessionToken) {
        try {
          // Verificar se a sessão ainda é válida
          const { data: session, error: sessionError } = await supabase
            .from('client_sessions')
            .select(`
              id,
              expires_at,
              client_id,
              booking_clients!inner (
                id,
                name,
                email,
                phone,
                created_at
              )
            `)
            .eq('session_token', sessionToken)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (sessionError || !session) {
            console.log('❌ Sessão inválida ou expirada, removendo token');
            localStorage.removeItem('client_session_token');
            localStorage.removeItem('client');
            setClient(null);
          } else {
            console.log('✅ Sessão válida encontrada');
            const clientData = session.booking_clients;
            setClient(clientData);
            // Salvar dados do cliente no localStorage para cache
            localStorage.setItem('client', JSON.stringify(clientData));
          }
        } catch (error) {
          console.error('Erro ao verificar sessão:', error);
          localStorage.removeItem('client_session_token');
          localStorage.removeItem('client');
          setClient(null);
        }
      } else {
        // Fallback para verificar localStorage antigo
        const savedClient = localStorage.getItem('client');
        if (savedClient) {
          try {
            const parsedClient = JSON.parse(savedClient);
            if (parsedClient && parsedClient.id && parsedClient.email) {
              setClient(parsedClient);
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
      }
      setLoading(false);
    };

    checkSavedClient();
  }, []);

  // Verificar se o cliente ainda existe no banco
  const verifyClientExists = async (clientId: string, email: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('booking_clients')
        .select('id, name, email, phone')
        .eq('id', clientId)
        .ilike('email', normalizedEmail) // Usar ilike para case-insensitive
        .single();

      if (error) {
        console.error('❌ Erro ao verificar cliente no banco:', error);
        // Se for erro de RLS, remover do localStorage
        if (error.code === '42501' || error.message.includes('row-level security')) {
          console.log('❌ Erro de RLS detectado, removendo cliente do localStorage');
          localStorage.removeItem('client');
          setClient(null);
          return false;
        }
        return false;
      }

      if (!data) {
        console.log('❌ Cliente não encontrado no banco, removendo do localStorage');
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
      console.error('❌ Erro inesperado ao verificar cliente no banco:', error);
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
      // Normalizar email para lowercase
      const normalizedEmail = data.email.toLowerCase().trim();
      
      // Verificar se o email já existe (usando .maybeSingle() para evitar erro de múltiplos registros)
      const { data: existingClient, error: checkError } = await supabase
        .from('booking_clients')
        .select('id')
        .ilike('email', normalizedEmail) // Usar ilike para case-insensitive
        .maybeSingle();

      // Se encontrou um cliente com este email, erro
      if (existingClient) {
        throw new Error('Email já cadastrado');
      }

      // Se houve erro diferente de "não encontrado", pode ser problema de RLS
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ useClientAuth: Erro ao verificar email existente:', checkError);
        throw new Error('Erro ao verificar email: ' + checkError.message);
      }

      const hashedPassword = hashPassword(data.password);
      
      console.log('🔍 useClientAuth: Tentando registrar cliente:', { name: data.name, email: normalizedEmail, phone: data.phone });
      
      const { data: newClient, error } = await supabase
        .from('booking_clients')
        .insert({
          name: data.name,
          email: normalizedEmail, // Salvar email normalizado
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
    mutationFn: async (data: LoginClientData & { user_id?: string }) => {
      console.log('🔍 useClientAuth: Tentando fazer login:', { email: data.email, user_id: data.user_id });
      
      // Normalizar email para lowercase para busca case-insensitive
      const normalizedEmail = data.email.toLowerCase().trim();
      console.log('🔍 useClientAuth: Email normalizado:', normalizedEmail);
      
      // Primeiro, tentar buscar cliente com user_id específico (se fornecido)
      if (data.user_id) {
        const { data: clientWithUserId, error: errorWithUserId } = await supabase
          .from('booking_clients')
          .select('*')
          .ilike('email', normalizedEmail) // Usar ilike para case-insensitive
          .eq('user_id', data.user_id)
          .maybeSingle();

        if (clientWithUserId && !errorWithUserId) {
          console.log('✅ useClientAuth: Cliente encontrado com user_id específico');
          console.log('🔍 useClientAuth: Verificando senha:', { 
            password: data.password, 
            hash: clientWithUserId.password_hash,
            hashCalculado: hashPassword(data.password)
          });
          if (!verifyPassword(data.password, clientWithUserId.password_hash)) {
            console.log('❌ useClientAuth: Senha não confere');
            throw new Error('Email ou senha incorretos');
          }
          console.log('✅ useClientAuth: Senha confere, login bem-sucedido');
          return clientWithUserId;
        }
      }
      
      // Se não encontrou com user_id específico, buscar por email apenas (case-insensitive)
      const { data: client, error } = await supabase
        .from('booking_clients')
        .select('*')
        .ilike('email', normalizedEmail) // Usar ilike para case-insensitive
        .maybeSingle();

      if (error) {
        console.error('❌ useClientAuth: Erro ao buscar cliente:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Email ou senha incorretos');
        }
        throw new Error('Erro ao fazer login: ' + error.message);
      }

      if (!client) {
        throw new Error('Email ou senha incorretos');
      }

      if (!verifyPassword(data.password, client.password_hash)) {
        throw new Error('Email ou senha incorretos');
      }

      // Criar sessão para o cliente
      const sessionToken = generateSessionToken();
      const deviceInfo = getDeviceInfo();
      
      const { error: sessionError } = await supabase
        .from('client_sessions')
        .insert({
          client_id: client.id,
          session_token: sessionToken,
          device_info: deviceInfo,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
        });

      if (sessionError) {
        console.error('❌ Erro ao criar sessão:', sessionError);
        // Continuar mesmo com erro de sessão
      } else {
        console.log('✅ Sessão criada com sucesso');
        // Salvar token da sessão no localStorage
        localStorage.setItem('client_session_token', sessionToken);
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
  const logout = async () => {
    const sessionToken = localStorage.getItem('client_session_token');
    
    if (sessionToken) {
      try {
        // Remover sessão do banco de dados
        await supabase
          .from('client_sessions')
          .delete()
          .eq('session_token', sessionToken);
        console.log('✅ Sessão removida do banco');
      } catch (error) {
        console.error('❌ Erro ao remover sessão do banco:', error);
      }
    }
    
    // Limpar localStorage
    localStorage.removeItem('client_session_token');
    localStorage.removeItem('client');
    setClient(null);
  };

  return {
    client,
    loading,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    loginClient: loginMutation.mutate,
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
