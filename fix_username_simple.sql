-- Script simples para atualizar username para p3droo6
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o usuário atual
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'name' as nome,
    p.username,
    p.name as profile_name
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'pedrogreef06@gmail.com';

-- 2. Atualizar o username existente para p3droo6
UPDATE public.user_profiles 
SET 
    username = 'p3droo6',
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);

-- 3. Verificar se a atualização funcionou
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'name' as nome,
    p.username,
    p.name as profile_name,
    p.phone,
    p.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'pedrogreef06@gmail.com';

-- 4. Verificar o link de agendamento
SELECT 
    'Link de agendamento:' as info,
    'https://arenatime.com/booking/p3droo6' as link_esperado;
