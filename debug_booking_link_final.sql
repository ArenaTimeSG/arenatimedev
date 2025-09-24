-- Script final para verificar e corrigir tudo relacionado ao link de agendamento
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o username p3droo6 existe e está correto
SELECT 
    'VERIFICAÇÃO FINAL DO USERNAME:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.user_profiles WHERE username = 'p3droo6') 
        THEN '✅ Username p3droo6 encontrado'
        ELSE '❌ Username p3droo6 NÃO encontrado'
    END as status_username;

-- 2. Mostrar dados completos do usuário
SELECT 
    'DADOS DO USUÁRIO:' as info,
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'name' as nome_auth,
    p.username,
    p.name as nome_profile,
    p.phone,
    p.created_at as profile_created,
    p.updated_at as profile_updated
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'pedrogreef06@gmail.com';

-- 3. Verificar configurações de agendamento online
SELECT 
    'CONFIGURAÇÕES DE AGENDAMENTO:' as info,
    s.online_enabled,
    s.online_booking,
    s.working_hours,
    s.payment_policy,
    s.time_format_interval,
    s.created_at as settings_created,
    s.updated_at as settings_updated
FROM public.settings s
WHERE s.user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);

-- 4. Verificar modalidades cadastradas
SELECT 
    'MODALIDADES CADASTRADAS:' as info,
    COUNT(*) as total_modalidades
FROM public.modalities 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);

-- 5. Mostrar as modalidades
SELECT 
    'LISTA DE MODALIDADES:' as info,
    id,
    name,
    valor,
    duracao,
    created_at
FROM public.modalities 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
)
ORDER BY name;

-- 6. Links de agendamento possíveis (com domínios corretos)
SELECT 
    'LINKS DE AGENDAMENTO:' as info,
    'https://arenatime.com/booking/p3droo6' as link_producao,
    'https://arenatime.vercel.app/booking/p3droo6' as link_vercel,
    'http://localhost:5173/booking/p3droo6' as link_local;

-- 7. Testar a query exata que o useAdminByUsername usa
SELECT 
    'TESTE DA QUERY DO useAdminByUsername:' as info,
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

-- 8. Verificar se há algum problema com RLS
SELECT 
    'VERIFICAÇÃO DE RLS:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'settings', 'modalities')
ORDER BY tablename, policyname;
