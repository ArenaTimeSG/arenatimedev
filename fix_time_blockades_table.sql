-- Script para corrigir a tabela time_blockades
-- Adicionar campos necessários para bloqueios recorrentes

-- 1. Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_blockades'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar campos necessários para recorrência
ALTER TABLE public.time_blockades 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS original_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS is_indefinite BOOLEAN DEFAULT FALSE;

-- 3. Adicionar comentários para os novos campos
COMMENT ON COLUMN public.time_blockades.is_recurring IS 'Indica se este bloqueio é parte de uma série recorrente';
COMMENT ON COLUMN public.time_blockades.recurrence_type IS 'Tipo de recorrência: daily, weekly, monthly';
COMMENT ON COLUMN public.time_blockades.original_date IS 'Data original quando o bloqueio recorrente foi criado';
COMMENT ON COLUMN public.time_blockades.end_date IS 'Data final para a série de bloqueios recorrentes';
COMMENT ON COLUMN public.time_blockades.is_indefinite IS 'Indica se o bloqueio recorrente não tem data final';

-- 4. Verificar se os campos foram adicionados
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'time_blockades'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Testar inserção de um bloqueio recorrente
-- (Execute este teste para verificar se funciona)
-- INSERT INTO public.time_blockades (
--     user_id,
--     date,
--     time_slot,
--     reason,
--     description,
--     is_recurring,
--     recurrence_type,
--     original_date,
--     end_date,
--     is_indefinite
-- ) VALUES (
--     'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f', -- Substitua pelo seu user_id
--     '2025-09-24',
--     '16:00:00',
--     'Teste',
--     'Teste de bloqueio recorrente',
--     true,
--     'weekly',
--     '2025-09-24',
--     '2026-09-24',
--     false
-- );

-- 6. Verificar se a inserção funcionou
-- SELECT * FROM time_blockades WHERE reason = 'Teste' ORDER BY created_at DESC LIMIT 1;
