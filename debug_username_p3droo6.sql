-- Script para verificar se o username p3droo6 foi salvo corretamente
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o username existe na tabela user_profiles
SELECT 
    user_id,
    name,
    username,
    phone,
    created_at,
    updated_at
FROM public.user_profiles 
WHERE username = 'p3droo6';

-- 2. Verificar se o usuário está associado ao email correto
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'name' as nome,
    p.username,
    p.name as profile_name,
    p.phone,
    p.created_at,
    p.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'pedrogreef06@gmail.com';

-- 3. Verificar se há configurações para este usuário
SELECT 
    user_id,
    online_enabled,
    personal_data,
    created_at,
    updated_at
FROM public.settings 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);

-- 4. Verificar se há modalidades para este usuário
SELECT 
    id,
    user_id,
    name,
    valor,
    duracao,
    created_at
FROM public.modalities 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);

-- 5. Testar a query que o useAdminByUsername usa
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data,
    p.username,
    p.name,
    p.phone,
    s.online_enabled,
    s.personal_data,
    s.working_hours,
    s.online_booking
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
LEFT JOIN public.settings s ON u.id = s.user_id
WHERE p.username = 'p3droo6';
