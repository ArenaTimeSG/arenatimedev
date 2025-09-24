-- Script para verificar a estrutura atual da tabela time_blockades
-- e identificar o problema com o salvamento de bloqueios

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'time_blockades'
AND table_schema = 'public';

-- 2. Verificar a estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'time_blockades'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'time_blockades'
ORDER BY policyname;

-- 4. Verificar se há dados na tabela
SELECT COUNT(*) as total_blockades FROM time_blockades;

-- 5. Verificar dados existentes (se houver)
SELECT 
    id,
    user_id,
    date,
    time_slot,
    reason,
    description,
    created_at
FROM time_blockades 
ORDER BY created_at DESC
LIMIT 5;
