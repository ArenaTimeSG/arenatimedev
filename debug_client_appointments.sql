-- Script para debugar agendamentos do cliente
-- Verificar se os agendamentos estão sendo criados corretamente

-- 1. Verificar todos os agendamentos recentes
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
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 2. Verificar clientes na tabela booking_clients
SELECT 
    id,
    name,
    email,
    phone,
    created_at
FROM booking_clients 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 3. Verificar se há agendamentos com client_id que não existem na tabela booking_clients
SELECT 
    a.id,
    a.client_id,
    a.date,
    a.status,
    a.modality,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.created_at >= NOW() - INTERVAL '7 days'
AND bc.id IS NULL;

-- 4. Verificar agendamentos online recentes
SELECT 
    id,
    cliente_nome,
    cliente_email,
    cliente_telefone,
    data,
    horario,
    modalidade_name,
    status,
    created_at
FROM online_reservations 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 5. Verificar se há inconsistências entre online_reservations e appointments
SELECT 
    or_data.id as reservation_id,
    or_data.cliente_nome,
    or_data.cliente_email,
    or_data.data,
    or_data.horario,
    a.id as appointment_id,
    a.client_id,
    a.status as appointment_status
FROM online_reservations or_data
LEFT JOIN appointments a ON (
    a.date = CONCAT(or_data.data, 'T', or_data.horario, ':00') 
    AND a.modality = or_data.modalidade_name
)
WHERE or_data.created_at >= NOW() - INTERVAL '7 days'
ORDER BY or_data.created_at DESC;
