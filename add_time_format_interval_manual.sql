-- Script para adicionar a coluna time_format_interval manualmente
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna time_format_interval se não existir
DO $$ 
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'time_format_interval'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE public.settings 
        ADD COLUMN time_format_interval INTEGER DEFAULT 60;
        
        -- Atualizar registros existentes
        UPDATE public.settings 
        SET time_format_interval = 60
        WHERE time_format_interval IS NULL;
        
        -- Tornar a coluna NOT NULL
        ALTER TABLE public.settings 
        ALTER COLUMN time_format_interval SET NOT NULL;
        
        -- Adicionar constraint
        ALTER TABLE public.settings 
        ADD CONSTRAINT check_time_format_interval 
        CHECK (time_format_interval IN (30, 60));
        
        -- Adicionar comentário
        COMMENT ON COLUMN public.settings.time_format_interval IS 'Time slot interval in minutes: 30 for half-hour slots (13:30, 14:30), 60 for full-hour slots (13:00, 14:00)';
        
        RAISE NOTICE 'Coluna time_format_interval adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna time_format_interval já existe.';
    END IF;
END $$;
