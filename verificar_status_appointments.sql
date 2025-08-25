-- =====================================================
-- Verificar status válidos da tabela appointments
-- =====================================================

-- 1. Verificar o tipo enum appointment_status
SELECT 
    'Tipos de status válidos' as tipo,
    enumlabel as status_valido
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'appointment_status'
)
ORDER BY enumsortorder;

-- 2. Verificar agendamentos existentes e seus status
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
ORDER BY a.date DESC
LIMIT 10;

-- 3. Contar agendamentos por status
SELECT 
    'Contagem por status' as tipo,
    a.status,
    COUNT(*) as quantidade
FROM appointments a
GROUP BY a.status
ORDER BY quantidade DESC;

-- 4. Verificar agendamentos de um admin específico
SELECT 
    'Agendamentos do admin' as tipo,
    a.id,
    a.date,
    a.modality,
    a.status,
    c.name as cliente_nome,
    c.email as cliente_email,
    a.valor_total,
    up.username as admin_username
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN public.user_profiles up ON a.user_id = up.user_id
WHERE up.username = 'p3droo6'  -- ⚠️ ALTERE AQUI: coloque o username do admin
AND a.date >= CURRENT_DATE
ORDER BY a.date;
