/*
=====================================================
Debug - Verificar horários ocupados
=====================================================
Execute este script no Supabase SQL Editor
Data: 2025-01-22
=====================================================
*/

-- 1. Verificar agendamentos para a data 2025-08-27
SELECT 
    'Agendamentos para 27/08/2025' as tipo,
    id,
    date,
    hora,
    user_id,
    status,
    modality
FROM public.appointments 
WHERE CAST(date AS date) = '2025-08-27'
ORDER BY date;

-- 2. Verificar agendamentos para o usuário específico
SELECT 
    'Agendamentos do usuário' as tipo,
    id,
    date,
    hora,
    user_id,
    status,
    modality
FROM public.appointments 
WHERE user_id = '53eaab23-022b-4cd3-92b2-c4a5395cd765'  -- ⚠️ ALTERE AQUI: coloque o user_id correto
AND CAST(date AS date) = '2025-08-27'
ORDER BY date;

-- 3. Verificar todos os agendamentos do usuário
SELECT 
    'Todos os agendamentos do usuário' as tipo,
    id,
    date,
    hora,
    user_id,
    status,
    modality
FROM public.appointments 
WHERE user_id = '53eaab23-022b-4cd3-92b2-c4a5395cd765'  -- ⚠️ ALTERE AQUI: coloque o user_id correto
ORDER BY date DESC
LIMIT 10;

-- 4. Verificar configurações de working_hours do usuário
SELECT 
    'Working hours do usuário' as tipo,
    user_id,
    working_hours
FROM public.settings 
WHERE user_id = '53eaab23-022b-4cd3-92b2-c4a5395cd765'  -- ⚠️ ALTERE AQUI: coloque o user_id correto
LIMIT 1;

/*
=====================================================
FIM DO SCRIPT
=====================================================
*/
