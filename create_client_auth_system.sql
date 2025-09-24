-- =====================================================
-- CRIAÇÃO DE SISTEMA DE AUTENTICAÇÃO PARA CLIENTES
-- =====================================================

-- Este script cria um sistema completo de autenticação para clientes
-- usando Supabase Auth, mas mantendo-os separados dos administradores

-- 1. CRIAR TABELA PARA CLIENTES AUTENTICADOS
-- =====================================================

-- Criar tabela para clientes que usam Supabase Auth
CREATE TABLE IF NOT EXISTS public.client_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT client_profiles_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT client_profiles_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON public.client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON public.client_profiles(email);
CREATE INDEX IF NOT EXISTS idx_client_profiles_phone ON public.client_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_client_profiles_active ON public.client_profiles(is_active);

-- 2. CONFIGURAR RLS PARA CLIENT_PROFILES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Clientes podem ver apenas seus próprios dados
CREATE POLICY "Clients can view own profile" ON public.client_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: Clientes podem criar apenas seu próprio perfil
CREATE POLICY "Clients can insert own profile" ON public.client_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: Clientes podem atualizar apenas seu próprio perfil
CREATE POLICY "Clients can update own profile" ON public.client_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE: Clientes podem deletar apenas seu próprio perfil
CREATE POLICY "Clients can delete own profile" ON public.client_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 3. CRIAR TRIGGER PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_client_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_client_profiles_updated_at
    BEFORE UPDATE ON public.client_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_client_profiles_updated_at();

-- 4. MIGRAR DADOS EXISTENTES (OPCIONAL)
-- =====================================================

-- Função para migrar clientes existentes para o novo sistema
-- (Execute apenas se quiser migrar dados existentes)
/*
DO $$
DECLARE
    client_record RECORD;
    new_user_id UUID;
BEGIN
    -- Para cada cliente existente na tabela booking_clients
    FOR client_record IN 
        SELECT DISTINCT name, email, phone 
        FROM public.booking_clients 
        WHERE email IS NOT NULL AND email != ''
    LOOP
        -- Verificar se já existe um usuário com este email
        SELECT id INTO new_user_id 
        FROM auth.users 
        WHERE email = client_record.email;
        
        -- Se não existe, criar novo usuário
        IF new_user_id IS NULL THEN
            -- Criar usuário no Supabase Auth
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(),
                'authenticated',
                'authenticated',
                client_record.email,
                crypt('temp_password', gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '',
                '',
                '',
                ''
            ) RETURNING id INTO new_user_id;
            
            -- Criar perfil do cliente
            INSERT INTO public.client_profiles (
                user_id,
                name,
                email,
                phone,
                is_active
            ) VALUES (
                new_user_id,
                client_record.name,
                client_record.email,
                client_record.phone,
                true
            );
        END IF;
    END LOOP;
END $$;
*/

-- 5. CRIAR FUNÇÃO PARA CRIAR CLIENTE COM AUTENTICAÇÃO
-- =====================================================

-- Função para criar cliente com autenticação Supabase
CREATE OR REPLACE FUNCTION create_authenticated_client(
    p_name TEXT,
    p_email TEXT,
    p_password TEXT,
    p_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    new_user_id UUID;
    client_profile_id UUID;
    result JSONB;
BEGIN
    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email já cadastrado'
        );
    END IF;
    
    -- Criar usuário no Supabase Auth
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
    ) RETURNING id INTO new_user_id;
    
    -- Criar perfil do cliente
    INSERT INTO public.client_profiles (
        user_id,
        name,
        email,
        phone,
        is_active
    ) VALUES (
        new_user_id,
        p_name,
        p_email,
        p_phone,
        true
    ) RETURNING id INTO client_profile_id;
    
    -- Retornar sucesso
    RETURN jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'client_profile_id', client_profile_id,
        'message', 'Cliente criado com sucesso'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar estrutura da tabela
SELECT 'Estrutura da tabela client_profiles:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'client_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 'Políticas RLS da tabela client_profiles:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'client_profiles';

-- Verificar função criada
SELECT 'Função create_authenticated_client criada:' as info;
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name = 'create_authenticated_client' AND routine_schema = 'public';

-- 7. INFORMAÇÕES SOBRE O NOVO SISTEMA
-- =====================================================

SELECT 'SISTEMA DE AUTENTICAÇÃO DE CLIENTES CRIADO' as status;
SELECT 'Estrutura criada:' as info;
SELECT '- Tabela client_profiles para dados dos clientes' as info;
SELECT '- Integração com Supabase Auth (auth.users)' as info;
SELECT '- Políticas RLS para segurança' as info;
SELECT '- Função para criar clientes autenticados' as info;
SELECT 'Os clientes agora usam Supabase Auth mas são separados dos administradores.' as info;
