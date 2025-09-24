-- Script para corrigir agendamentos com modality_id NULL
-- Os agendamentos online não estão salvando o modality_id corretamente

-- 1. Verificar agendamentos com modality_id NULL
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
WHERE a.modality_id IS NULL
AND a.user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY a.created_at DESC;

-- 2. Verificar modalidades disponíveis para este admin
SELECT 
    id,
    name,
    valor,
    user_id,
    created_at
FROM modalities 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
ORDER BY name;

-- 3. CORRIGIR: Atualizar modality_id para agendamentos com modality 'FUTSAL'
UPDATE appointments 
SET modality_id = (
    SELECT id 
    FROM modalities 
    WHERE name = 'FUTSAL' 
    AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
    LIMIT 1
)
WHERE modality = 'FUTSAL'
AND modality_id IS NULL
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 4. CORRIGIR: Atualizar modality_id para agendamentos com modality 'VOLEI'
UPDATE appointments 
SET modality_id = (
    SELECT id 
    FROM modalities 
    WHERE name = 'VOLEI' 
    AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
    LIMIT 1
)
WHERE modality = 'VOLEI'
AND modality_id IS NULL
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 5. CORRIGIR: Atualizar modality_id para agendamentos com modality 'PILATES'
UPDATE appointments 
SET modality_id = (
    SELECT id 
    FROM modalities 
    WHERE name = 'PILATES' 
    AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
    LIMIT 1
)
WHERE modality = 'PILATES'
AND modality_id IS NULL
AND user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 6. Verificar se a correção funcionou
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
ORDER BY a.created_at DESC;
