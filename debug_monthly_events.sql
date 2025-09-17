-- Verificar se há dados na tabela monthly_events
SELECT COUNT(*) as total_events FROM public.monthly_events;

-- Verificar a estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'monthly_events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se há dados e seus status
SELECT id, user_id, event_date, client_name, status, created_at 
FROM public.monthly_events 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.monthly_events'::regclass;
