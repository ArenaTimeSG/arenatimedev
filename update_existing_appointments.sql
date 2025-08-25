-- =====================================================
-- ATUALIZAR AGENDAMENTOS EXISTENTES
-- =====================================================
-- Execute este script após o setup_modalities.sql
-- Data: 2025-01-22
-- =====================================================

-- 1. Atualizar agendamentos existentes que não têm valor_total
UPDATE public.appointments 
SET valor_total = 50.00 
WHERE valor_total IS NULL OR valor_total = 0;

-- 2. Verificar se há agendamentos sem modality_id
-- (Isso é normal para agendamentos antigos)

-- 3. Criar uma modalidade padrão para agendamentos antigos (opcional)
-- Descomente as linhas abaixo se quiser criar uma modalidade padrão
/*
INSERT INTO public.modalities (user_id, name, valor)
SELECT DISTINCT 
  user_id,
  'Modalidade Padrão' as name,
  50.00 as valor
FROM public.appointments 
WHERE modality_id IS NULL
  AND user_id NOT IN (
    SELECT DISTINCT user_id 
    FROM public.modalities 
    WHERE name = 'Modalidade Padrão'
  );
*/

-- 4. Verificar o resultado
SELECT 
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN valor_total > 0 THEN 1 END) as with_value,
  COUNT(CASE WHEN modality_id IS NOT NULL THEN 1 END) as with_modality
FROM public.appointments;

-- 5. Mostrar alguns exemplos
SELECT 
  id,
  date,
  modality,
  modality_id,
  valor_total,
  status
FROM public.appointments 
LIMIT 5;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

