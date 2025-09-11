-- =====================================================
-- Script para atualizar bloqueios existentes
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Primeiro, vamos ver quantos bloqueios existem
SELECT COUNT(*) as total_blockades FROM public.time_blockades;

-- Verificar se os campos de recorrência estão NULL
SELECT 
  COUNT(*) as total,
  COUNT(is_recurring) as has_is_recurring,
  COUNT(recurrence_type) as has_recurrence_type,
  COUNT(original_date) as has_original_date
FROM public.time_blockades;

-- Atualizar bloqueios existentes para ter valores padrão
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

-- Verificar se a atualização foi bem-sucedida
SELECT 
  COUNT(*) as total,
  COUNT(is_recurring) as has_is_recurring,
  COUNT(recurrence_type) as has_recurrence_type,
  COUNT(original_date) as has_original_date
FROM public.time_blockades;

-- Mostrar alguns exemplos de bloqueios atualizados
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
