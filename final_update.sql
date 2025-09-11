-- Execute este comando no Supabase SQL Editor
-- Ele vai corrigir todos os 3353 bloqueios existentes

UPDATE public.time_blockades 
SET 
  is_recurring = FALSE,
  recurrence_type = NULL,
  original_date = NULL,
  end_date = NULL,
  is_indefinite = FALSE;
