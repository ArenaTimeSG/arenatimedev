-- =====================================================
-- Script para debugar bloqueios e entender a estrutura
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar bloqueios às 09:00
SELECT 
  date,
  time_slot,
  reason,
  is_recurring,
  recurrence_type,
  original_date,
  created_at,
  EXTRACT(DOW FROM date) as day_of_week,
  CASE EXTRACT(DOW FROM date)
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    WHEN 6 THEN 'Sábado'
  END as day_name
FROM public.time_blockades 
WHERE time_slot = '09:00'
ORDER BY date;

-- 2. Verificar quantos bloqueios às 09:00 por dia da semana
SELECT 
  EXTRACT(DOW FROM date) as day_of_week,
  CASE EXTRACT(DOW FROM date)
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    WHEN 6 THEN 'Sábado'
  END as day_name,
  COUNT(*) as count,
  COUNT(CASE WHEN is_recurring = true THEN 1 END) as recurring_count,
  COUNT(CASE WHEN is_recurring = false THEN 1 END) as non_recurring_count
FROM public.time_blockades 
WHERE time_slot = '09:00'
GROUP BY EXTRACT(DOW FROM date)
ORDER BY day_of_week;

-- 3. Verificar original_date dos bloqueios às 09:00
SELECT 
  original_date,
  COUNT(*) as count,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM public.time_blockades 
WHERE time_slot = '09:00' 
  AND is_recurring = true
GROUP BY original_date
ORDER BY original_date;
