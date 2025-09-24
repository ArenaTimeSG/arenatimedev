-- Script para testar a consulta do ClientDashboard
-- Simular a consulta que está sendo feita no frontend

-- Substitua 'CLIENT_ID_AQUI' pelo ID real do cliente
-- Substitua 'ADMIN_USER_ID_AQUI' pelo ID real do admin

-- 1. Verificar se o cliente existe
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE id = 'CLIENT_ID_AQUI';

-- 2. Verificar se há agendamentos para este cliente
SELECT 
    id,
    client_id,
    user_id,
    date,
    status,
    modality,
    valor_total,
    booking_source,
    created_at
FROM appointments 
WHERE client_id = 'CLIENT_ID_AQUI'
AND user_id = 'ADMIN_USER_ID_AQUI'
ORDER BY date ASC;

-- 3. Verificar todos os agendamentos recentes (últimos 7 dias)
SELECT 
    a.id,
    a.client_id,
    a.user_id,
    a.date,
    a.status,
    a.modality,
    a.valor_total,
    a.booking_source,
    a.created_at,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.created_at >= NOW() - INTERVAL '7 days'
ORDER BY a.created_at DESC;

-- 4. Verificar se há agendamentos online recentes
SELECT 
    or_data.id,
    or_data.cliente_nome,
    or_data.cliente_email,
    or_data.cliente_telefone,
    or_data.data,
    or_data.horario,
    or_data.modalidade_name,
    or_data.status,
    or_data.created_at
FROM online_reservations or_data
WHERE or_data.created_at >= NOW() - INTERVAL '7 days'
ORDER BY or_data.created_at DESC;

-- 5. Verificar se há inconsistências entre as tabelas
SELECT 
    'online_reservations' as tabela,
    COUNT(*) as total_registros
FROM online_reservations 
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'appointments' as tabela,
    COUNT(*) as total_registros
FROM appointments 
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'booking_clients' as tabela,
    COUNT(*) as total_registros
FROM booking_clients 
WHERE created_at >= NOW() - INTERVAL '7 days';
