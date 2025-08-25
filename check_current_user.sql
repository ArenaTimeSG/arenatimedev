-- =====================================================
-- Verificar usuário atual e configurações
-- =====================================================

-- 1. Verificar todos os usuários recentes
SELECT 
    au.id as auth_user_id,
    au.email,
    au.email_confirmed_at,
    au.created_at as auth_created,
    up.id as profile_id,
    up.name,
    up.username,
    up.role,
    up.is_active,
    up.created_at as profile_created
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC
LIMIT 10;

-- 2. Verificar especificamente o usuário com username p3droo6
SELECT 
    au.id as auth_user_id,
    au.email,
    au.email_confirmed_at,
    up.id as profile_id,
    up.name,
    up.username,
    up.role,
    up.is_active,
    up.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.username = 'p3droo6' OR au.email ILIKE '%pedrogreef%'
ORDER BY au.created_at DESC;

-- 3. Verificar se há usuários sem username
SELECT 
    au.id as auth_user_id,
    au.email,
    up.id as profile_id,
    up.name,
    up.username,
    up.role,
    up.is_active
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.username IS NULL OR up.username = ''
ORDER BY au.created_at DESC;

-- 4. Verificar configurações do usuário
SELECT 
    s.user_id,
    s.modalities_enabled,
    s.working_hours,
    s.default_interval,
    s.notifications_enabled,
    s.theme,
    s.personal_data
FROM public.settings s
JOIN auth.users au ON s.user_id = au.id
WHERE au.email ILIKE '%pedrogreef%'
ORDER BY s.created_at DESC;

-- 5. Verificar se o trigger está funcionando
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_settings';

-- 6. Verificar se a função existe
SELECT 
    proname,
    prosrc IS NOT NULL as function_exists
FROM pg_proc 
WHERE proname = 'create_default_settings';
