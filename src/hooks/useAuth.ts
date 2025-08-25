import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SignUpData } from '@/types/user';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signUp = async (signUpData: SignUpData) => {
    try {
      console.log('🔐 Iniciando cadastro de usuário:', { email: signUpData.email, name: signUpData.name });
      
      // 1. Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            name: signUpData.name,
            phone: signUpData.phone
          }
        }
      });

      if (error) {
        console.error('❌ Erro no cadastro:', error);
        return { data: null, error };
      }

      if (data?.user) {
        console.log('✅ Usuário criado com sucesso:', data.user.id);
        
        // 2. Criar/atualizar perfil em user_profiles usando upsert
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: data.user.id,
              name: signUpData.name,
              email: signUpData.email,
              phone: signUpData.phone,
              role: 'user',
              is_active: true,
            });

          if (profileError) {
            console.error('❌ Erro ao criar perfil:', profileError);
            // Não falhar o cadastro se o perfil não puder ser criado
          } else {
            console.log('✅ Perfil criado/atualizado com sucesso');
          }
        } catch (profileError) {
          console.error('❌ Erro inesperado ao criar perfil:', profileError);
          // Não falhar o cadastro se o perfil não puder ser criado
        }
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Erro inesperado no cadastro:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
};