-- Script para corrigir a tabela time_blockades
-- Resolver problema de start_time e end_time NOT NULL

-- 1. Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'time_blockades'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. SOLUÇÃO: Tornar start_time e end_time nullable
ALTER TABLE public.time_blockades 
ALTER COLUMN start_time DROP NOT NULL,
ALTER COLUMN end_time DROP NOT NULL;

-- 3. Verificar se as colunas foram alteradas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'time_blockades'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Testar inserção com a estrutura correta
-- (Execute este teste para verificar se funciona)
INSERT INTO public.time_blockades (
    user_id,
    date,
    time_slot,
    reason,
    description,
    is_recurring,
    recurrence_type,
    original_date,
    end_date,
    is_indefinite
) VALUES (
    'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f', -- Substitua pelo seu user_id
    '2025-09-24',
    '16:00:00',
    'Teste',
    'Teste de bloqueio recorrente',
    true,
    'weekly',
    '2025-09-24',
    '2026-09-24',
    false
);

-- 5. Verificar se a inserção funcionou
SELECT * FROM time_blockades WHERE reason = 'Teste' ORDER BY created_at DESC LIMIT 1;

-- 6. Limpar dados de teste
DELETE FROM time_blockades WHERE reason = 'Teste';
