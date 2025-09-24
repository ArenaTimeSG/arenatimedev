-- Script para verificar e corrigir a tabela user_profiles
-- As informações pessoais não estão aparecendo na página de configurações

-- 1. Verificar se a tabela user_profiles existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'user_profiles'
AND table_schema = 'public';

-- 2. Verificar a estrutura da tabela user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- 4. Verificar dados existentes (se houver)
SELECT 
    id,
    user_id,
    name,
    email,
    phone,
    role,
    is_active,
    created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar se o usuário atual tem perfil
-- (Substitua pelo seu user_id)
SELECT 
    id,
    user_id,
    name,
    email,
    phone,
    role,
    is_active,
    created_at
FROM user_profiles 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 6. Se não existir perfil, criar um
-- (Execute apenas se não houver perfil)
-- INSERT INTO public.user_profiles (
--     user_id,
--     name,
--     email,
--     phone,
--     role,
--     is_active
-- ) VALUES (
--     'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f', -- Substitua pelo seu user_id
--     'GINASIO TANINAO',
--     'PEDROGREEF06@GMAIL.COM',
--     '(11) 99999-9999',
--     'admin',
--     true
-- );

-- 7. Verificar políticas RLS da tabela user_profiles
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;
