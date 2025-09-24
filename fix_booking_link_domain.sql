-- Script para verificar e corrigir o link de agendamento com o domínio correto
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o username p3droo6 existe
SELECT 
    'Verificação do username p3droo6:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.user_profiles WHERE username = 'p3droo6') 
        THEN '✅ Username encontrado'
        ELSE '❌ Username NÃO encontrado'
    END as status;

-- 2. Mostrar dados completos do usuário
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'name' as nome_auth,
    p.username,
    p.name as nome_profile,
    p.phone,
    s.online_enabled,
    CASE 
        WHEN s.online_enabled = true THEN '✅ Agendamento online HABILITADO'
        ELSE '❌ Agendamento online DESABILITADO'
    END as status_agendamento
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
LEFT JOIN public.settings s ON u.id = s.user_id
WHERE u.email = 'pedrogreef06@gmail.com';

-- 3. Verificar se há modalidades cadastradas
SELECT 
    'Modalidades cadastradas:' as info,
    COUNT(*) as total_modalidades
FROM public.modalities 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);

-- 4. Mostrar as modalidades
SELECT 
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

-- 5. Links de agendamento possíveis
SELECT 
    'Links de agendamento:' as info,
    'https://arenatime.com/booking/p3droo6' as link_producao,
    'https://arenatime.vercel.app/booking/p3droo6' as link_vercel,
    'http://localhost:5173/booking/p3droo6' as link_local;

-- 6. Verificar configurações de agendamento online
SELECT 
    'Configurações de agendamento online:' as info,
    online_enabled,
    online_booking,
    working_hours,
    payment_policy,
    time_format_interval
FROM public.settings 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'pedrogreef06@gmail.com'
);
