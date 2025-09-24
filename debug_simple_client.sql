-- Script simplificado para debug do cliente específico
-- Baseado nos logs: clientId: '4a74abf1-3182-49a5-8187-2c758e55a664', adminUserId: 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'

-- 1. Verificar se o cliente existe na tabela booking_clients
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE id = '4a74abf1-3182-49a5-8187-2c758e55a664';

-- 2. Verificar todos os agendamentos para este cliente específico
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

-- 3. Verificar todos os agendamentos para este admin
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
    id,
    cliente_nome,
    cliente_email,
    cliente_telefone,
    data,
    horario,
    modalidade_id,
    status,
    created_at
FROM online_reservations 
WHERE admin_user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY created_at DESC;

-- 5. Verificar se há agendamentos com email similar
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
