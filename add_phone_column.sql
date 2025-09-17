-- Adicionar coluna phone na tabela monthly_events
ALTER TABLE public.monthly_events 
ADD COLUMN IF NOT EXISTS phone text;

-- Comentário para documentar a coluna
COMMENT ON COLUMN public.monthly_events.phone IS 'Número de telefone do cliente (opcional)';
