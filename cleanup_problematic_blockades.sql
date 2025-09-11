-- =====================================================
-- Script para limpar bloqueios problemáticos
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar quantos bloqueios existem
SELECT COUNT(*) as total_blockades FROM public.time_blockades;

-- 2. Verificar bloqueios duplicados ou problemáticos
SELECT 
  time_slot,
  COUNT(*) as count,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM public.time_blockades 
GROUP BY time_slot 
HAVING COUNT(*) > 50
ORDER BY count DESC;

-- 3. Verificar bloqueios com campos de recorrência NULL
SELECT 
  COUNT(*) as null_recurrence_fields
FROM public.time_blockades 
WHERE is_recurring IS NULL 
   OR recurrence_type IS NULL 
   OR original_date IS NULL;

-- 4. Atualizar todos os bloqueios existentes para ter valores padrão
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

-- 5. Verificar se a atualização foi bem-sucedida
SELECT 
  COUNT(*) as total,
  COUNT(is_recurring) as has_is_recurring,
  COUNT(recurrence_type) as has_recurrence_type,
  COUNT(original_date) as has_original_date
FROM public.time_blockades;

-- 6. Mostrar alguns exemplos de bloqueios atualizados
SELECT 
  id,
  date,
  time_slot,
  reason,
  is_recurring,
  recurrence_type,
  original_date,
  created_at
FROM public.time_blockades 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Verificar se há bloqueios duplicados por data e horário
SELECT 
  user_id,
  date,
  time_slot,
  COUNT(*) as duplicates
FROM public.time_blockades 
GROUP BY user_id, date, time_slot 
HAVING COUNT(*) > 1
ORDER BY duplicates DESC;
