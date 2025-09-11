-- Script para verificar e executar a migração time_format_interval se necessário

-- PASSO 1: Verificar se a coluna time_format_interval existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name = 'time_format_interval';

-- PASSO 2: Se a coluna não existir, executar a migração
-- (Remova os comentários das linhas abaixo se a coluna não existir)

-- ALTER TABLE public.settings
-- ADD COLUMN IF NOT EXISTS time_format_interval INTEGER DEFAULT 60;

-- UPDATE public.settings
-- SET time_format_interval = 60
-- WHERE time_format_interval IS NULL;

-- ALTER TABLE public.settings
-- ALTER COLUMN time_format_interval SET NOT NULL;

-- COMMENT ON COLUMN public.settings.time_format_interval IS 'Interval for time slots (30 or 60 minutes)';

-- PASSO 3: Verificar se a migração foi bem-sucedida
SELECT id, time_format_interval
FROM public.settings
LIMIT 5;

-- PASSO 4: Verificar se há configurações sem time_format_interval
SELECT COUNT(*) as configs_sem_time_format
FROM public.settings
WHERE time_format_interval IS NULL;
