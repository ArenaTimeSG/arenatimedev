-- Script para ENCONTRAR o agendamento bugado
-- Vamos buscar de forma mais ampla para identificar o agendamento correto

-- BUSCA AMPLA: Todos os agendamentos de 11/09/2025 às 09:00
SELECT 
    a.id,
    a.date,
    a.status,
    a.modality,
    a.created_at,
    c.name as client_name,
    c.id as client_id
FROM public.appointments a
LEFT JOIN public.clients c ON a.client_id = c.id
WHERE
    DATE(a.date) = '2025-09-11' AND
    EXTRACT(HOUR FROM a.date) = 9 AND
    EXTRACT(MINUTE FROM a.date) = 0
ORDER BY a.created_at;

-- BUSCA ALTERNATIVA: Todos os agendamentos de 11/09/2025 (qualquer hora)
SELECT 
    a.id,
    a.date,
    a.status,
    a.modality,
    a.created_at,
    c.name as client_name,
    c.id as client_id
FROM public.appointments a
LEFT JOIN public.clients c ON a.client_id = c.id
WHERE
    DATE(a.date) = '2025-09-11'
ORDER BY a.date;

-- BUSCA POR MODALIDADE: Todos os agendamentos com "volei"
SELECT 
    a.id,
    a.date,
    a.status,
    a.modality,
    a.created_at,
    c.name as client_name,
    c.id as client_id
FROM public.appointments a
LEFT JOIN public.clients c ON a.client_id = c.id
WHERE
    a.modality ILIKE '%volei%'
ORDER BY a.date DESC;
