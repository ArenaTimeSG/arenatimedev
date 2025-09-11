-- Execute este script no Supabase SQL Editor
-- Ele vai corrigir todos os bloqueios existentes

UPDATE public.time_blockades 
SET 
  is_recurring = FALSE,
  recurrence_type = NULL,
  original_date = NULL,
  end_date = NULL,
  is_indefinite = FALSE;

-- Verificar se funcionou
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_recurring = FALSE THEN 1 END) as non_recurring
FROM public.time_blockades;
