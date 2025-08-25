-- =====================================================
-- Verificar usuário existente e configurações
-- =====================================================

-- 1. Verificar se o usuário existe no auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud
FROM auth.users 
WHERE email ILIKE '%pedrogreef06%' OR email ILIKE '%PEDROGREEF06%';

-- 2. Verificar se existe perfil na tabela user_profiles
SELECT 
    id,
    user_id,
    name,
    email,
    username,
    phone,
    role,
    is_active,
    created_at,
    updated_at
FROM public.user_profiles 
WHERE email ILIKE '%pedrogreef06%' OR email ILIKE '%PEDROGREEF06%';

-- 3. Verificar se o username já existe
SELECT 
    id,
    user_id,
    name,
    email,
    username,
    role,
    is_active
FROM public.user_profiles 
WHERE username = 'p3droo6';

-- 4. Listar todos os usuários para ver o estado geral
SELECT 
    up.id,
    up.user_id,
    up.name,
    up.email,
    up.username,
    up.role,
    up.is_active,
    up.created_at,
    au.email_confirmed_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at DESC
LIMIT 10;

-- 5. Verificar se há usuários sem username
SELECT 
    id,
    user_id,
    name,
    email,
    username,
    role,
    is_active
FROM public.user_profiles 
WHERE username IS NULL OR username = ''
ORDER BY created_at DESC;
