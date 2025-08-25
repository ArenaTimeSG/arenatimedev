-- =====================================================
-- Script de teste para verificar registro de usuário
-- =====================================================

-- 1. Verificar estrutura da tabela user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 4. Testar inserção manual (simular processo de cadastro)
-- Primeiro, vamos criar um usuário de teste no auth.users (se não existir)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Verificar se já existe um usuário de teste
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'teste@exemplo.com';
    
    IF test_user_id IS NULL THEN
        -- Inserir usuário de teste no auth.users
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
            'teste@exemplo.com',
            crypt('senha123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'Usuário de teste criado com ID: %', test_user_id;
    ELSE
        RAISE NOTICE 'Usuário de teste já existe com ID: %', test_user_id;
    END IF;
    
    -- Agora testar inserção no user_profiles
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
            'Usuário Teste',
            'teste@exemplo.com',
            '11999999999',
            'usuario-teste',
            'user',
            true
        );
        
        RAISE NOTICE 'Perfil de usuário criado com sucesso!';
        
        -- Verificar se foi inserido
        SELECT 
            id,
            user_id,
            name,
            email,
            username,
            role,
            is_active
        FROM public.user_profiles 
        WHERE user_id = test_user_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar perfil: %', SQLERRM;
    END;
END $$;

-- 5. Verificar constraints da tabela
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.user_profiles'::regclass;

-- 6. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles';

-- 7. Limpar dados de teste
DELETE FROM public.user_profiles WHERE email = 'teste@exemplo.com';
DELETE FROM auth.users WHERE email = 'teste@exemplo.com';
