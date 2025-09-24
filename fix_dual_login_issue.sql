-- Script para corrigir o problema de múltiplos logins
-- O email PEDROGREEF06@GMAIL.COM tem login de admin E cliente

-- 1. Verificar os dois clientes existentes
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at,
    CASE 
        WHEN user_id IS NULL THEN 'CLIENTE (sem user_id)'
        ELSE 'ADMIN (com user_id)'
    END as tipo_login
FROM booking_clients 
WHERE email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY created_at DESC;

-- 2. Verificar qual cliente está sendo usado no agendamento
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
    bc.user_id as client_user_id,
    CASE 
        WHEN bc.user_id IS NULL THEN 'CLIENTE (sem user_id)'
        ELSE 'ADMIN (com user_id)'
    END as tipo_cliente_no_agendamento
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE bc.email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY a.created_at DESC;

-- 3. CORRIGIR: Atualizar o agendamento para usar o client_id correto
-- O agendamento deve usar o client_id do CLIENTE (sem user_id), não do admin
UPDATE appointments 
SET client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'  -- ID do cliente (sem user_id)
WHERE id = '002b46ed-75a3-4469-8c86-fedfa044fd49';

-- 4. Verificar se a correção funcionou
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
WHERE a.id = '002b46ed-75a3-4469-8c86-fedfa044fd49';

-- 5. Verificar se agora aparece no painel do cliente
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
WHERE client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'  -- ID do cliente
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'     -- ID do admin
ORDER BY created_at DESC;
