-- Script para verificar e corrigir o username definitivamente
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o estado atual
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

-- 2. Forçar atualização do username para p3droo6
UPDATE public.user_profiles 
SET 
    username = 'p3droo6',
    name = 'Pedro Junior Greef Flores',
    phone = '51997982724',
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
    p.created_at,
    p.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'pedrogreef06@gmail.com';

-- 4. Verificar se há outros usuários com o mesmo username
SELECT 
    username,
    COUNT(*) as quantidade
FROM public.user_profiles 
WHERE username = 'p3droo6'
GROUP BY username;

-- 5. Mostrar o link de agendamento correto
SELECT 
    'Link de agendamento:' as info,
    'https://arenatime.com/booking/p3droo6' as link_esperado;
