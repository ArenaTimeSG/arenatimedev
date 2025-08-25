/*
=====================================================
Testar agendamento online corrigido
=====================================================
Execute este script no Supabase SQL Editor
Data: 2025-01-22
=====================================================
*/

-- 1. Verificar estrutura da tabela appointments
SELECT 
    'Estrutura appointments' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- 2. Verificar se existe campo hora
SELECT 
    'Campo hora' as tipo,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'appointments'
AND column_name = 'hora';

-- 3. Verificar constraints únicas
SELECT 
    'Constraints únicas' as tipo,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'appointments'
AND constraint_type = 'UNIQUE';

-- 4. Listar agendamentos existentes
SELECT 
    'Agendamentos existentes' as tipo,
    id,
    date,
    hora,
    user_id,
    status,
    modality
FROM public.appointments 
ORDER BY date DESC
LIMIT 10;

-- 5. Testar busca de horários disponíveis para uma data específica
-- Substitua 'USER_ID_AQUI' pelo ID real do usuário
WITH horarios_possiveis AS (
    SELECT '08:00' as hora UNION ALL
    SELECT '09:00' UNION ALL
    SELECT '10:00' UNION ALL
    SELECT '11:00' UNION ALL
    SELECT '12:00' UNION ALL
    SELECT '13:00' UNION ALL
    SELECT '14:00' UNION ALL
    SELECT '15:00' UNION ALL
    SELECT '16:00' UNION ALL
    SELECT '17:00' UNION ALL
    SELECT '18:00' UNION ALL
    SELECT '19:00' UNION ALL
    SELECT '20:00' UNION ALL
    SELECT '21:00'
),
horarios_ocupados AS (
         SELECT 
         TO_CHAR(CAST(date AS time), 'HH24:MI') as hora
     FROM public.appointments 
     WHERE CAST(date AS date) = '2025-01-26'  -- ⚠️ ALTERE AQUI: coloque a data desejada
    AND user_id = 'USER_ID_AQUI'     -- ⚠️ ALTERE AQUI: coloque o user_id
    AND status != 'a_cobrar'
)
SELECT 
    'Horários disponíveis para 2025-01-26' as tipo,
    hp.hora as horario_disponivel
FROM horarios_possiveis hp
LEFT JOIN horarios_ocupados ho ON hp.hora = ho.hora
WHERE ho.hora IS NULL
ORDER BY hp.hora;

-- 6. Verificar configurações de working_hours
SELECT 
    'Working hours do usuário' as tipo,
    user_id,
    working_hours
FROM public.settings 
WHERE user_id = 'USER_ID_AQUI'  -- ⚠️ ALTERE AQUI: coloque o user_id
LIMIT 1;

/*
=====================================================
FIM DO SCRIPT
=====================================================
*/
