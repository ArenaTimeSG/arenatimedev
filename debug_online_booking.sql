-- =====================================================
-- Debug do Agendamento Online
-- =====================================================

-- 1. Verificar se o usuário teste existe
SELECT '1. Usuário teste:' as info;
SELECT 
    id,
    user_id,
    name,
    role,
    is_active,
    created_at
FROM public.user_profiles 
WHERE name = 'teste';

-- 2. Verificar se há modalidades cadastradas
SELECT '2. Modalidades do usuário teste:' as info;
SELECT 
    m.id,
    m.name,
    m.valor,
    up.name as user_name
FROM public.modalities m
JOIN public.user_profiles up ON m.user_id = up.user_id
WHERE up.name = 'teste';

-- 3. Verificar configurações
SELECT '3. Configurações do usuário teste:' as info;
SELECT 
    id,
    user_id,
    working_hours,
    default_interval,
    theme,
    created_at,
    updated_at
FROM public.settings 
WHERE user_id = (
    SELECT user_id FROM public.user_profiles WHERE name = 'teste'
);

-- 4. Verificar políticas RLS
SELECT '4. Políticas RLS em user_profiles:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

SELECT '5. Políticas RLS em modalities:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'modalities';

-- 5. Teste de acesso público
SELECT '6. Teste de acesso público - user_profiles:' as info;
SELECT id, name, role, is_active 
FROM public.user_profiles 
WHERE name = 'teste'
LIMIT 1;

SELECT '7. Teste de acesso público - modalities:' as info;
SELECT m.id, m.name, m.valor, up.name as user_name
FROM public.modalities m
JOIN public.user_profiles up ON m.user_id = up.user_id
WHERE up.name = 'teste'
LIMIT 3;

-- 6. Verificar se a tabela online_reservations existe
SELECT '8. Estrutura da tabela online_reservations:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'online_reservations'
ORDER BY ordinal_position;

-- 7. Verificar se há dados na tabela online_reservations
SELECT '9. Dados na tabela online_reservations:' as info;
SELECT COUNT(*) as total_reservas
FROM public.online_reservations;

-- 8. Verificar se há dados na tabela clients
SELECT '10. Dados na tabela clients:' as info;
SELECT COUNT(*) as total_clientes
FROM public.clients;

-- 9. Verificar se há dados na tabela appointments
SELECT '11. Dados na tabela appointments:' as info;
SELECT COUNT(*) as total_agendamentos
FROM public.appointments;
