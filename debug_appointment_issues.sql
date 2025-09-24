-- Script para investigar e corrigir o problema dos agendamentos
-- Verificar por que aparece "Cliente não identificado" e nome não aparece no painel

-- 1. Verificar todos os agendamentos para este admin
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
    bc.email as client_email,
    bc.user_id as client_user_id
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY a.created_at DESC;

-- 2. Verificar especificamente os agendamentos de hoje (25/09)
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
    bc.email as client_email,
    bc.user_id as client_user_id
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
AND DATE(a.date) = '2025-09-25'
ORDER BY a.date;

-- 3. Verificar se há agendamentos com client_id inválido
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
WHERE a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
AND bc.id IS NULL  -- client_id não existe na tabela booking_clients
ORDER BY a.created_at DESC;

-- 4. Verificar todos os clientes para este admin
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY created_at DESC;

-- 5. Verificar se há clientes sem user_id (clientes online)
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE user_id IS NULL
AND email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY created_at DESC;
