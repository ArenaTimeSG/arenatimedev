-- =====================================================
-- Teste de Integração: Username + Agendamento Online
-- =====================================================

-- 1. Verificar se a migração de username foi aplicada
SELECT 'Verificando migração de username:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'username';

-- 2. Verificar usuários existentes e seus usernames
SELECT 'Usuários e usernames:' as info;
SELECT 
    id,
    user_id,
    name,
    username,
    role,
    is_active,
    created_at
FROM public.user_profiles 
ORDER BY created_at DESC;

-- 3. Atualizar usuários existentes com username (se necessário)
-- Executar apenas se houver usuários sem username
UPDATE public.user_profiles 
SET username = lower(
    regexp_replace(
        regexp_replace(
            regexp_replace(name, '[àáâãäå]', 'a', 'g'),
            '[èéêë]', 'e', 'g'
        ),
        '[ìíîï]', 'i', 'g'
    )
) || '-' || substr(md5(random()::text), 1, 4)
WHERE username IS NULL OR username = '';

-- 4. Verificar se todos os usuários têm username
SELECT 'Verificação final de usernames:' as info;
SELECT 
    id,
    name,
    username,
    CASE 
        WHEN username IS NULL OR username = '' THEN '❌ SEM USERNAME'
        ELSE '✅ OK'
    END as status
FROM public.user_profiles
ORDER BY name;

-- 5. Teste de busca por username
SELECT 'Teste de busca por username:' as info;
SELECT 
    id,
    name,
    username,
    role,
    is_active
FROM public.user_profiles 
WHERE username = 'teste' -- Substitua por um username real
LIMIT 1;

-- 6. Verificar configurações de agendamento online
SELECT 'Configurações de agendamento online:' as info;
SELECT 
    s.id,
    s.user_id,
    up.name as user_name,
    up.username,
    s.working_hours,
    s.default_interval,
    s.created_at
FROM public.settings s
JOIN public.user_profiles up ON s.user_id = up.user_id
WHERE up.username = 'teste' -- Substitua por um username real
LIMIT 1;

-- 7. Verificar modalidades do usuário
SELECT 'Modalidades do usuário:' as info;
SELECT 
    m.id,
    m.name,
    m.valor,
    up.name as user_name,
    up.username
FROM public.modalities m
JOIN public.user_profiles up ON m.user_id = up.user_id
WHERE up.username = 'teste' -- Substitua por um username real
ORDER BY m.name;

-- 8. Teste de inserção de reserva online
SELECT 'Teste de inserção de reserva online:' as info;

-- Primeiro, obter o user_id do usuário teste
WITH user_info AS (
    SELECT user_id, username 
    FROM public.user_profiles 
    WHERE username = 'teste' -- Substitua por um username real
    LIMIT 1
)
INSERT INTO public.online_reservations (
    admin_user_id,
    modalidade_id,
    data,
    horario,
    cliente_nome,
    cliente_email,
    cliente_telefone,
    valor,
    status,
    auto_confirmada,
    created_at
)
SELECT 
    ui.user_id,
    m.id,
    '2025-01-27',
    '10:00',
    'Cliente Teste Online',
    'cliente.teste@email.com',
    '(11) 99999-9999',
    80.00,
    'pendente',
    false,
    now()
FROM user_info ui
JOIN public.modalities m ON m.user_id = ui.user_id
WHERE m.name = 'Futsal' -- Substitua por uma modalidade real
LIMIT 1
RETURNING 
    id,
    admin_user_id,
    modalidade_id,
    data,
    horario,
    cliente_nome,
    status,
    auto_confirmada;

-- 9. Verificar reservas online criadas
SELECT 'Reservas online criadas:' as info;
SELECT 
    or.id,
    or.data,
    or.horario,
    or.cliente_nome,
    or.cliente_email,
    or.status,
    or.auto_confirmada,
    m.name as modalidade,
    up.username as admin_username
FROM public.online_reservations or
JOIN public.modalities m ON or.modalidade_id = m.id
JOIN public.user_profiles up ON or.admin_user_id = up.user_id
WHERE up.username = 'teste' -- Substitua por um username real
ORDER BY or.created_at DESC
LIMIT 5;

-- 10. Teste de URL de agendamento
SELECT 'URLs de agendamento para teste:' as info;
SELECT 
    up.username,
    up.name,
    CASE 
        WHEN up.username IS NOT NULL AND up.username != '' THEN 
            'http://localhost:3000/booking/' || up.username
        ELSE 
            '❌ Username não configurado'
    END as booking_url
FROM public.user_profiles up
WHERE up.is_active = true
ORDER BY up.created_at DESC
LIMIT 5;
