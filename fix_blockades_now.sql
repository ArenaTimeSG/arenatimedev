-- =====================================================
-- Script SIMPLES para corrigir bloqueios existentes
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Atualizar todos os bloqueios existentes para ter valores padrão
UPDATE public.time_blockades 
SET 
  is_recurring = FALSE,
  recurrence_type = NULL,
  original_date = NULL,
  end_date = NULL,
  is_indefinite = FALSE
WHERE 
  is_recurring IS NULL 
  OR recurrence_type IS NULL 
  OR original_date IS NULL 
  OR end_date IS NULL 
  OR is_indefinite IS NULL;

-- 2. Verificar se foi atualizado
SELECT 
  COUNT(*) as total_blockades,
  COUNT(CASE WHEN is_recurring = FALSE THEN 1 END) as non_recurring,
  COUNT(CASE WHEN is_recurring = TRUE THEN 1 END) as recurring
FROM public.time_blockades;

-- 3. Mostrar alguns exemplos
SELECT 
  date,
  time_slot,
  reason,
  is_recurring,
  recurrence_type,
  original_date
FROM public.time_blockades 
ORDER BY created_at DESC 
LIMIT 5;
