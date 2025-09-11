-- =====================================================
-- Script para EXCLUIR TODOS os bloqueios existentes
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar o número de bloqueios antes da exclusão
SELECT COUNT(*) as total_blockades_before_deletion FROM public.time_blockades;

-- 2. Excluir todos os registros da tabela time_blockades
DELETE FROM public.time_blockades;

-- 3. Verificar o número de bloqueios após a exclusão
SELECT COUNT(*) as total_blockades_after_deletion FROM public.time_blockades;

-- 4. Verificar se a tabela está vazia
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Tabela limpa com sucesso!'
    ELSE '❌ Ainda há ' || COUNT(*) || ' bloqueios na tabela'
  END as status
FROM public.time_blockades;
