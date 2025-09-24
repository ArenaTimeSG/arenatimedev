-- Script para corrigir agendamentos online com status incorreto
-- Agendamentos online devem ter status 'agendado', não 'a_cobrar'

-- 1. Verificar agendamentos online com status incorreto
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
WHERE a.booking_source = 'online'
AND a.status = 'a_cobrar'
AND a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY a.created_at DESC;

-- 2. CORRIGIR: Alterar status de agendamentos online de 'a_cobrar' para 'agendado'
UPDATE appointments 
SET status = 'agendado'
WHERE booking_source = 'online'
AND status = 'a_cobrar'
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 3. Verificar se a correção funcionou
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
WHERE a.booking_source = 'online'
AND a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY a.created_at DESC;

-- 4. Verificar agendamentos manuais (devem manter status original)
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
WHERE a.booking_source = 'manual'
AND a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY a.created_at DESC;
