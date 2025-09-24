-- Script para testar a consulta exata do ClientDashboard
-- Simular a consulta que está sendo feita no frontend

-- 1. Verificar o cliente específico
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE id = '4a74abf1-3182-49a5-8187-2c758e55a664';

-- 2. Testar a consulta exata do ClientDashboard
SELECT 
    a.*,
    bc.name as client_name,
    bc.email as client_email,
    bc.phone as client_phone
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'
AND a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY a.date ASC;

-- 3. Verificar se há agendamentos para este cliente (sem filtro de user_id)
SELECT 
    a.*,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'
ORDER BY a.date ASC;

-- 4. Verificar se há agendamentos para este admin (sem filtro de client_id)
SELECT 
    a.*,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY a.date ASC;

-- 5. Verificar se há agendamentos recentes (últimos 7 dias)
SELECT 
    a.*,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.created_at >= NOW() - INTERVAL '7 days'
AND (a.client_id = '4a74abf1-3182-49a5-8187-2c758e55a664' 
     OR a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f')
ORDER BY a.created_at DESC;
