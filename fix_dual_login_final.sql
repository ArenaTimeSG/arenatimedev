-- Script para limpar dados duplicados e manter apenas o cliente correto
-- O email PEDROGREEF06@GMAIL.COM tem dois registros: admin e cliente

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

-- 2. Verificar agendamentos existentes
SELECT 
    a.id,
    a.client_id,
    a.user_id,
    a.date,
    a.status,
    a.modality,
    bc.name as client_name,
    bc.user_id as client_user_id
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE bc.email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY a.created_at DESC;

-- 3. CORRIGIR: Atualizar todos os agendamentos para usar o client_id correto
-- O agendamento deve usar o client_id do CLIENTE (sem user_id)
UPDATE appointments 
SET client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'  -- ID do cliente (sem user_id)
WHERE client_id = 'a5b48b7d-9aad-4791-90c9-156f71b27901'  -- ID do admin (com user_id)
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';     -- ID do admin

-- 4. Verificar se a correção funcionou
SELECT 
    a.id,
    a.client_id,
    a.user_id,
    a.date,
    a.status,
    a.modality,
    bc.name as client_name,
    bc.user_id as client_user_id
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE bc.email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY a.created_at DESC;

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

-- 6. OPCIONAL: Remover o cliente duplicado (admin) se não for mais necessário
-- CUIDADO: Só execute se tiver certeza que não há outros agendamentos
-- DELETE FROM booking_clients 
-- WHERE id = 'a5b48b7d-9aad-4791-90c9-156f71b27901' 
-- AND email = 'PEDROGREEF06@GMAIL.COM' 
-- AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';
