-- Script para encontrar e corrigir a conta problemática pedrogreef06@gmail.com
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe em auth.users
SELECT 
    'VERIFICAÇÃO EM auth.users:' as info,
    id,
    email,
    raw_user_meta_data->>'name' as nome,
    raw_user_meta_data->>'phone' as telefone,
    confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'pedrogreef06@gmail.com';

-- 2. Verificar se existe algum perfil para este usuário
SELECT 
    'VERIFICAÇÃO EM user_profiles:' as info,
    id,
    user_id,
    name,
    username,
    phone,
    created_at,
    updated_at
FROM public.user_profiles 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);

-- 3. Verificar se existe configurações para este usuário
SELECT 
    'VERIFICAÇÃO EM settings:' as info,
    id,
    user_id,
    online_enabled,
    personal_data,
    created_at,
    updated_at
FROM public.settings 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);

-- 4. Verificar se existe algum cliente com este email
SELECT 
    'VERIFICAÇÃO EM booking_clients:' as info,
    id,
    user_id,
    name,
    email,
    phone,
    created_at,
    updated_at
FROM public.booking_clients 
WHERE email = 'pedrogreef06@gmail.com';

-- 5. Verificar se existe algum agendamento para este usuário
SELECT 
    'VERIFICAÇÃO EM appointments:' as info,
    COUNT(*) as total_agendamentos
FROM public.appointments 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);

-- 6. Listar TODOS os usuários em auth.users para comparação
SELECT 
    'TODOS OS USUÁRIOS EM auth.users:' as info,
    id,
    email,
    raw_user_meta_data->>'name' as nome,
    confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC;
