-- Script para consultar todos os logins existentes no sistema
-- Execute este script no Supabase SQL Editor

-- 1. CONSULTAR USUÁRIOS ADMINISTRADORES (auth.users)
SELECT 
    'ADMIN' as tipo_usuario,
    id,
    email,
    raw_user_meta_data->>'name' as nome,
    raw_user_meta_data->>'phone' as telefone,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. CONSULTAR PERFIS DE USUÁRIOS (user_profiles)
SELECT 
    'PERFIL' as tipo_usuario,
    user_id,
    name as nome,
    username,
    phone as telefone,
    created_at,
    updated_at
FROM public.user_profiles
ORDER BY created_at DESC;

-- 3. CONSULTAR CLIENTES (booking_clients)
SELECT 
    'CLIENTE' as tipo_usuario,
    id as client_id,
    user_id,
    name as nome,
    email,
    phone as telefone,
    created_at,
    updated_at
FROM public.booking_clients
ORDER BY created_at DESC;

-- 4. CONSULTAR CONFIGURAÇÕES (settings) - para verificar usuários com configurações
SELECT 
    'CONFIG' as tipo_usuario,
    user_id,
    personal_data->>'name' as nome,
    personal_data->>'email' as email,
    personal_data->>'phone' as telefone,
    created_at,
    updated_at
FROM public.settings
WHERE personal_data IS NOT NULL AND personal_data != '{}'::jsonb
ORDER BY created_at DESC;

-- 5. RESUMO GERAL - CONTAGEM DE USUÁRIOS POR TIPO
SELECT 
    'RESUMO' as tipo_usuario,
    'Total de Administradores' as descricao,
    COUNT(*) as quantidade
FROM auth.users

UNION ALL

SELECT 
    'RESUMO' as tipo_usuario,
    'Total de Perfis' as descricao,
    COUNT(*) as quantidade
FROM public.user_profiles

UNION ALL

SELECT 
    'RESUMO' as tipo_usuario,
    'Total de Clientes' as descricao,
    COUNT(*) as quantidade
FROM public.booking_clients

UNION ALL

SELECT 
    'RESUMO' as tipo_usuario,
    'Total com Configurações' as descricao,
    COUNT(*) as quantidade
FROM public.settings
WHERE personal_data IS NOT NULL AND personal_data != '{}'::jsonb;

-- 6. CONSULTAR USUÁRIOS DUPLICADOS (mesmo email em diferentes tabelas)
SELECT 
    email,
    'ADMIN' as fonte,
    id as user_id,
    NULL as client_id
FROM auth.users

UNION ALL

SELECT 
    email,
    'CLIENTE' as fonte,
    user_id,
    id as client_id
FROM public.booking_clients

ORDER BY email, fonte;

-- 7. CONSULTAR ÚLTIMOS LOGINS (usuários que fizeram login recentemente)
SELECT 
    email,
    raw_user_meta_data->>'name' as nome,
    last_sign_in_at,
    created_at,
    CASE 
        WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'Ativo (últimos 7 dias)'
        WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'Ativo (últimos 30 dias)'
        WHEN last_sign_in_at IS NULL THEN 'Nunca fez login'
        ELSE 'Inativo (mais de 30 dias)'
    END as status_atividade
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST;
