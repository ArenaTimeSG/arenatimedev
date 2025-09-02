-- Debug: Verificar agendamentos e seus valores
SELECT 
    id,
    client_id,
    date,
    status,
    valor_total,
    recurrence_id,
    modality_id,
    created_at
FROM appointments 
WHERE user_id = 'SEU_USER_ID_AQUI'  -- Substitua pelo ID do usuário
ORDER BY date DESC;

-- Debug: Verificar agendamentos recorrentes especificamente
SELECT 
    id,
    client_id,
    date,
    status,
    valor_total,
    recurrence_id,
    modality_id,
    created_at
FROM appointments 
WHERE user_id = 'SEU_USER_ID_AQUI'  -- Substitua pelo ID do usuário
  AND recurrence_id IS NOT NULL
ORDER BY date DESC;

-- Debug: Verificar valores por status
SELECT 
    status,
    COUNT(*) as total_agendamentos,
    SUM(valor_total) as valor_total,
    AVG(valor_total) as valor_medio
FROM appointments 
WHERE user_id = 'SEU_USER_ID_AQUI'  -- Substitua pelo ID do usuário
GROUP BY status
ORDER BY status;

-- Debug: Verificar valores por status (incluindo recorrentes)
SELECT 
    status,
    CASE 
        WHEN recurrence_id IS NOT NULL THEN 'Recorrente'
        ELSE 'Único'
    END as tipo,
    COUNT(*) as total_agendamentos,
    SUM(valor_total) as valor_total,
    AVG(valor_total) as valor_medio
FROM appointments 
WHERE user_id = 'SEU_USER_ID_AQUI'  -- Substitua pelo ID do usuário
GROUP BY status, (recurrence_id IS NOT NULL)
ORDER BY status, tipo;

