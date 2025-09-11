-- Script para excluir agendamento bugado sem cliente
-- Data: 11/09/2025 às 09:00 - "Cliente não identificado" - "volei"

-- PASSO 1: VERIFICAR O AGENDAMENTO
-- Execute este SELECT primeiro para confirmar que você está prestes a excluir o agendamento correto
SELECT 
    a.id,
    a.date,
    a.status,
    a.modality,
    a.created_at,
    c.name as client_name
FROM public.appointments a
LEFT JOIN public.clients c ON a.client_id = c.id
WHERE
    DATE(a.date) = '2025-09-11' AND
    EXTRACT(HOUR FROM a.date) = 9 AND
    EXTRACT(MINUTE FROM a.date) = 0 AND
    (
        c.name IS NULL 
        OR c.name = '' 
        OR c.name = 'Cliente não identificado'
    ) AND
    (
        a.modality ILIKE '%volei%' 
        OR a.modality = 'volei'
    );

-- PASSO 2: EXCLUIR O AGENDAMENTO (APÓS VERIFICAÇÃO NO PASSO 1)
-- Remova os comentários (--) da linha DELETE e execute este bloco APENAS SE o SELECT acima retornou o agendamento correto

-- DELETE FROM public.appointments
-- WHERE
--     DATE(date) = '2025-09-11' AND
--     EXTRACT(HOUR FROM date) = 9 AND
--     EXTRACT(MINUTE FROM date) = 0 AND
--     client_id IN (
--         SELECT c.id FROM public.clients c 
--         WHERE c.name IS NULL 
--         OR c.name = '' 
--         OR c.name = 'Cliente não identificado'
--     ) AND
--     (
--         modality ILIKE '%volei%' 
--         OR modality = 'volei'
--     );

-- PASSO 3: VERIFICAR SE FOI EXCLUÍDO
-- Execute este SELECT após a exclusão para confirmar que o agendamento foi removido
-- SELECT COUNT(*) as agendamentos_restantes
-- FROM public.appointments a
-- LEFT JOIN public.clients c ON a.client_id = c.id
-- WHERE
--     DATE(a.date) = '2025-09-11' AND
--     EXTRACT(HOUR FROM a.date) = 9 AND
--     EXTRACT(MINUTE FROM a.date) = 0 AND
--     (
--         c.name IS NULL 
--         OR c.name = '' 
--         OR c.name = 'Cliente não identificado'
--     );
