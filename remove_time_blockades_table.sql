-- =====================================================
-- Script para remover a tabela time_blockades
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Remover trigger primeiro (se existir)
DROP TRIGGER IF EXISTS trigger_update_time_blockades_updated_at ON public.time_blockades;

-- Remover função (se existir)
DROP FUNCTION IF EXISTS update_time_blockades_updated_at();

-- Remover políticas RLS (se existirem)
DROP POLICY IF EXISTS "Users can manage their own time blockades" ON public.time_blockades;

-- Remover índices (se existirem)
DROP INDEX IF EXISTS idx_time_blockades_user_id;
DROP INDEX IF EXISTS idx_time_blockades_date;
DROP INDEX IF EXISTS idx_time_blockades_user_date;
DROP INDEX IF EXISTS idx_time_blockades_created_at;

-- Remover a tabela (se existir)
DROP TABLE IF EXISTS public.time_blockades;

-- Verificar se a tabela foi removida
DO $$
BEGIN
  -- Check if table still exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'time_blockades'
  ) THEN
    RAISE EXCEPTION 'Table time_blockades still exists and could not be removed';
  END IF;
  
  RAISE NOTICE 'Table time_blockades successfully removed from database';
END $$;
