-- Script para investigar o problema do client_id
-- A consulta principal não encontra agendamentos, mas a alternativa encontra 788

-- 1. Verificar o cliente específico
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE email = 'PEDROGREEF06@GMAIL.COM'
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 2. Verificar TODOS os clientes com este email (pode haver duplicatas)
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY created_at DESC;

-- 3. Verificar agendamentos para este admin (consulta alternativa que funciona)
SELECT 
    a.id,
    a.client_id,
    a.user_id,
    a.date,
    a.status,
    a.modality,
    a.modality_id,
    a.valor_total,
    a.booking_source,
    a.created_at,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY a.created_at DESC
LIMIT 10;

-- 4. Verificar agendamentos específicos para o cliente correto
-- (substitua 'CLIENT_ID_CORRETO' pelo ID do cliente da consulta 1)
-- SELECT 
--     a.id,
--     a.client_id,
--     a.user_id,
--     a.date,
--     a.status,
--     a.modality,
--     a.modality_id,
--     a.valor_total,
--     a.booking_source,
--     a.created_at,
--     bc.name as client_name,
--     bc.email as client_email
-- FROM appointments a
-- LEFT JOIN booking_clients bc ON a.client_id = bc.id
-- WHERE a.client_id = 'CLIENT_ID_CORRETO'
-- AND a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
-- ORDER BY a.created_at DESC;

-- 5. Verificar se há agendamentos com client_id diferente mas mesmo email
SELECT 
    a.id,
    a.client_id,
    a.user_id,
    a.date,
    a.status,
    a.modality,
    a.modality_id,
    a.valor_total,
    a.booking_source,
    a.created_at,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE bc.email = 'PEDROGREEF06@GMAIL.COM'
AND a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY a.created_at DESC;
