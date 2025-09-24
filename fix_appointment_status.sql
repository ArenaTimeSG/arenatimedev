-- Script para alterar o status do agendamento de "a_cobrar" para "agendado"
-- O agendamento deve aparecer como "Agendado" no painel do cliente

-- 1. Verificar o agendamento atual
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

-- 2. ALTERAR o status de "a_cobrar" para "agendado"
UPDATE appointments 
SET status = 'agendado'
WHERE id = '002b46ed-75a3-4469-8c86-fedfa044fd49';

-- 3. Verificar se a alteração funcionou
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

-- 4. Verificar se aparece como "Agendado" no painel do cliente
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
