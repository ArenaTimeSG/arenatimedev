-- Script para verificar agendamentos do cliente específico
-- Baseado nos logs: clientId: '4a74abf1-3182-49a5-8187-2c758e55a664', adminUserId: 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'

-- 1. Verificar se há agendamentos para este cliente específico
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
WHERE client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY created_at DESC;

-- 2. Verificar todos os agendamentos para este cliente (independente do user_id)
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
WHERE client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'
ORDER BY created_at DESC;

-- 3. Verificar todos os agendamentos para este admin (independente do client_id)
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
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY created_at DESC;

-- 4. Verificar se há agendamentos online recentes
SELECT 
    or_data.id,
    or_data.cliente_nome,
    or_data.cliente_email,
    or_data.cliente_telefone,
    or_data.data,
    or_data.horario,
    or_data.modalidade_id,
    m.name as modalidade_name,
    or_data.status,
    or_data.created_at
FROM online_reservations or_data
LEFT JOIN modalities m ON or_data.modalidade_id = m.id
WHERE or_data.admin_user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY or_data.created_at DESC;

-- 5. Verificar se o cliente existe na tabela booking_clients
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE id = '4a74abf1-3182-49a5-8187-2c758e55a664';

-- 6. Verificar se há agendamentos com email similar
SELECT 
    a.id,
    a.client_id,
    a.user_id,
    a.date,
    a.status,
    a.modality,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE bc.email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY a.created_at DESC;

-- 7. Verificar se há inconsistências entre online_reservations e appointments
SELECT 
    or_data.id as reservation_id,
    or_data.cliente_nome,
    or_data.cliente_email,
    or_data.data,
    or_data.horario,
    m.name as modalidade_name,
    a.id as appointment_id,
    a.client_id,
    a.status as appointment_status
FROM online_reservations or_data
LEFT JOIN modalities m ON or_data.modalidade_id = m.id
LEFT JOIN appointments a ON (
    a.date = (or_data.data || 'T' || or_data.horario || ':00')::timestamp with time zone
    AND a.modality = m.name
    AND a.user_id = or_data.admin_user_id
)
WHERE or_data.admin_user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY or_data.created_at DESC;
