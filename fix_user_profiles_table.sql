-- =====================================================
-- Script para corrigir a tabela user_profiles e políticas RLS
-- =====================================================

-- 1. Verificar se a coluna username existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'username'
    ) THEN
        -- Adicionar campo username na tabela user_profiles
        ALTER TABLE public.user_profiles 
        ADD COLUMN username VARCHAR(50);
        
        -- Criar índice para melhor performance nas buscas por username
        CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
        
        -- Adicionar constraint para garantir que username seja único
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_username_unique UNIQUE (username);
        
        -- Adicionar constraint para validar formato do username (apenas letras, números e hífens)
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_username_format 
        CHECK (username ~ '^[a-zA-Z0-9-]+$');
        
        -- Adicionar constraint para garantir que username tenha pelo menos 3 caracteres
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_username_length 
        CHECK (length(username) >= 3);
        
        -- Adicionar constraint para garantir que username tenha no máximo 50 caracteres
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_username_max_length 
        CHECK (length(username) <= 50);
        
        RAISE NOTICE 'Coluna username adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna username já existe';
    END IF;
END $$;

-- 2. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can view active user profiles for booking" ON public.user_profiles;

-- 3. Criar novas políticas RLS
-- Política para leitura pública (necessária para agendamento online)
CREATE POLICY "Public can view active user profiles for booking" ON public.user_profiles
    FOR SELECT USING (is_active = true);

-- Política para usuários inserirem seus próprios perfis
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios perfis
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários visualizarem seus próprios perfis
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Verificar se RLS está habilitado
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 6. Verificar políticas criadas
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';
