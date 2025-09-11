-- Script para verificar se time_format_interval está funcionando

-- PASSO 1: Verificar se a coluna existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name = 'time_format_interval';

-- PASSO 2: Verificar dados na tabela settings
SELECT id, user_id, time_format_interval, created_at, updated_at
FROM public.settings
ORDER BY updated_at DESC
LIMIT 5;

-- PASSO 3: Verificar se há registros com time_format_interval NULL
SELECT COUNT(*) as registros_com_null
FROM public.settings
WHERE time_format_interval IS NULL;

-- PASSO 4: Verificar se há registros com time_format_interval = 30
SELECT COUNT(*) as registros_com_30
FROM public.settings
WHERE time_format_interval = 30;

-- PASSO 5: Verificar se há registros com time_format_interval = 60
SELECT COUNT(*) as registros_com_60
FROM public.settings
WHERE time_format_interval = 60;
