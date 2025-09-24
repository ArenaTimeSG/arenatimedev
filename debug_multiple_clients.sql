-- Script para identificar o problema de múltiplos clientes
-- Verificar se há múltiplos clientes com o mesmo email

-- 1. Verificar todos os clientes com o email PEDROGREEF06@GMAIL.COM
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

-- 2. Verificar todos os agendamentos para este email
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
WHERE bc.email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY a.created_at DESC;

-- 3. Verificar se há agendamentos online recentes
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
WHERE cliente_email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY created_at DESC;

-- 4. Verificar se há clientes duplicados (mesmo email, diferentes user_id)
SELECT 
    email,
    COUNT(*) as total_clientes,
    STRING_AGG(id::text, ', ') as client_ids,
    STRING_AGG(user_id::text, ', ') as user_ids
FROM booking_clients 
WHERE email = 'PEDROGREEF06@GMAIL.COM'
GROUP BY email
HAVING COUNT(*) > 1;
