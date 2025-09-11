-- MIGRAÇÃO URGENTE: Adicionar coluna time_format_interval
-- Execute este script no Supabase Dashboard > SQL Editor

-- PASSO 1: Adicionar a coluna time_format_interval
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS time_format_interval INTEGER DEFAULT 60;

-- PASSO 2: Atualizar registros existentes
UPDATE public.settings
SET time_format_interval = 60
WHERE time_format_interval IS NULL;

-- PASSO 3: Tornar a coluna obrigatória
ALTER TABLE public.settings
ALTER COLUMN time_format_interval SET NOT NULL;

-- PASSO 4: Adicionar comentário
COMMENT ON COLUMN public.settings.time_format_interval IS 'Interval for time slots (30 or 60 minutes)';

-- PASSO 5: Verificar se funcionou
SELECT id, time_format_interval, user_id
FROM public.settings
LIMIT 5;
