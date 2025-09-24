-- Script para corrigir o status do agendamento
-- O agendamento está aparecendo como "A Cobrar" mesmo sendo no futuro

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
    created_at,
    CASE 
        WHEN date > NOW() THEN 'FUTURO'
        WHEN date < NOW() THEN 'PASSADO'
        ELSE 'HOJE'
    END as situacao_temporal
FROM appointments 
WHERE client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY date DESC;

-- 2. CORRIGIR: Alterar status de "a_cobrar" para "agendado" para agendamentos futuros
UPDATE appointments 
SET status = 'agendado'
WHERE client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
AND status = 'a_cobrar'
AND date > NOW();  -- Apenas agendamentos futuros

-- 3. Verificar se a correção funcionou
SELECT 
    id,
    client_id,
    user_id,
    date,
    status,
    modality,
    valor_total,
    booking_source,
    created_at,
    CASE 
        WHEN date > NOW() THEN 'FUTURO'
        WHEN date < NOW() THEN 'PASSADO'
        ELSE 'HOJE'
    END as situacao_temporal
FROM appointments 
WHERE client_id = '4a74abf1-3182-49a5-8187-2c758e55a664'
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY date DESC;

-- 4. Verificar se agora aparece no painel do cliente
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
ORDER BY date ASC;
