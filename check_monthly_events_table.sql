-- Verificar se a tabela monthly_events existe e sua estrutura
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'monthly_events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints da tabela
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.monthly_events'::regclass;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_events FROM public.monthly_events;
