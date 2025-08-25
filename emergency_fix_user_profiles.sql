-- =====================================================
-- Script de Emergência - Corrigir tabela user_profiles
-- =====================================================

-- 1. Desabilitar RLS temporariamente para debug
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se a coluna username existe e adicionar se necessário
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN username VARCHAR(50);
        RAISE NOTICE 'Coluna username adicionada';
    ELSE
        RAISE NOTICE 'Coluna username já existe';
    END IF;
END $$;

-- 3. Remover constraints problemáticas se existirem
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_unique;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_format;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_length;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_max_length;

-- 4. Adicionar constraints de forma mais segura
DO $$
BEGIN
    -- Adicionar constraint UNIQUE apenas se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_username_unique'
    ) THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_username_unique UNIQUE (username);
    END IF;
    
    -- Adicionar constraint de formato
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_username_format'
    ) THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_username_format 
        CHECK (username ~ '^[a-zA-Z0-9-]+$');
    END IF;
    
    -- Adicionar constraint de comprimento mínimo
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_username_length'
    ) THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_username_length 
        CHECK (length(username) >= 3);
    END IF;
    
    -- Adicionar constraint de comprimento máximo
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_username_max_length'
    ) THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_username_max_length 
        CHECK (length(username) <= 50);
    END IF;
END $$;

-- 5. Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- 6. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 7. Testar inserção manual
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Testar inserção direta
    BEGIN
        INSERT INTO public.user_profiles (
            user_id,
            name,
            email,
            phone,
            username,
            role,
            is_active
        ) VALUES (
            test_user_id,
            'Teste Usuário',
            'teste@exemplo.com',
            '11999999999',
            'teste-usuario',
            'user',
            true
        );
        
        RAISE NOTICE 'Inserção de teste bem-sucedida!';
        
        -- Limpar teste
        DELETE FROM public.user_profiles WHERE user_id = test_user_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro na inserção de teste: %', SQLERRM;
    END;
END $$;

-- 8. Reabilitar RLS com políticas corretas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can view active user profiles for booking" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

-- Criar políticas corretas
CREATE POLICY "Public can view active user profiles for booking" ON public.user_profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- 9. Verificar políticas criadas
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 10. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';
