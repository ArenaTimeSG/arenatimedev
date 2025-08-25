-- =====================================================
-- Buscar agendamentos existentes para um admin específico
-- =====================================================

-- 1. Primeiro, vamos ver todos os admins disponíveis
SELECT 
    'Admins disponíveis' as tipo,
    up.user_id,
    up.username,
    up.name,
    up.email
FROM public.user_profiles up
WHERE up.role = 'user'
ORDER BY up.name;

-- 2. Agora vamos buscar agendamentos para um admin específico
-- Substitua 'USERNAME_DO_ADMIN' pelo username real do admin que você quer verificar
-- Exemplo: WHERE up.username = 'p3droo6'

SELECT 
    'Agendamentos existentes' as tipo,
    a.id,
    a.date,
    a.modality,
    a.status,
    c.name as cliente_nome,
    c.email as cliente_email,
    a.valor_total
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN public.user_profiles up ON a.user_id = up.user_id
WHERE up.username = 'p3droo6'  -- ⚠️ ALTERE AQUI: coloque o username do admin
AND a.date >= CURRENT_DATE
AND a.status != 'a_cobrar'  -- Excluir apenas agendamentos pendentes, manter os confirmados
ORDER BY a.date;

-- 3. Para ver agendamentos de hoje especificamente
SELECT 
    'Agendamentos de hoje' as tipo,
    a.id,
    a.date,
    a.modality,
    a.status,
    c.name as cliente_nome,
    c.email as cliente_email,
    a.valor_total
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN public.user_profiles up ON a.user_id = up.user_id
WHERE up.username = 'p3droo6'  -- ⚠️ ALTERE AQUI: coloque o username do admin
AND DATE(a.date) = CURRENT_DATE
AND a.status != 'a_cobrar'
ORDER BY a.date;

-- 4. Para ver agendamentos de uma data específica
-- Substitua '2024-01-25' pela data que você quer verificar
SELECT 
    'Agendamentos de data específica' as tipo,
    a.id,
    a.date,
    a.modality,
    a.status,
    c.name as cliente_nome,
    c.email as cliente_email,
    a.valor_total
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN public.user_profiles up ON a.user_id = up.user_id
WHERE up.username = 'p3droo6'  -- ⚠️ ALTERE AQUI: coloque o username do admin
AND DATE(a.date) = '2024-01-25'  -- ⚠️ ALTERE AQUI: coloque a data desejada
AND a.status != 'a_cobrar'
ORDER BY a.date;
