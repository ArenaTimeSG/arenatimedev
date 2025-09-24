-- Script para corrigir a inconsistência de client_id
-- O agendamento foi criado com client_id diferente do cliente logado

-- 1. Verificar o agendamento existente
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
WHERE id = '002b46ed-75a3-4469-8c86-fedfa044fd49';

-- 2. Verificar o cliente correto (o que está logado)
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE id = '4a74abf1-3182-49a5-8187-2c758e55a664';

-- 3. Verificar o cliente incorreto (o que está no agendamento)
SELECT 
    id,
    name,
    email,
    phone,
    user_id,
    created_at
FROM booking_clients 
WHERE id = 'a5b48b7d-9aad-4791-90c9-156f71b27901';

-- 4. CORRIGIR: Atualizar o agendamento para usar o client_id correto
UPDATE appointments 
SET client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'
WHERE id = '002b46ed-75a3-4469-8c86-fedfa044fd49';

-- 5. Verificar se a correção funcionou
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
WHERE id = '002b46ed-75a3-4469-8c86-fedfa044fd49';

-- 6. Verificar se agora aparece no painel do cliente
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
