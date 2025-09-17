-- Corrigir a constraint para incluir 'cancelado'
-- Primeiro, remover a constraint antiga
ALTER TABLE public.monthly_events 
DROP CONSTRAINT IF EXISTS monthly_events_status_check;

-- Criar nova constraint que inclui 'cancelado'
ALTER TABLE public.monthly_events 
ADD CONSTRAINT monthly_events_status_check 
CHECK (status IN ('a_cobrar', 'pago', 'cancelado'));

-- Verificar se a constraint foi aplicada corretamente
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.monthly_events'::regclass
AND conname = 'monthly_events_status_check';
