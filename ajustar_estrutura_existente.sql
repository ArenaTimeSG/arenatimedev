/*
=====================================================
Ajustar estrutura existente - Adicionar campo hora
=====================================================
Execute este script no Supabase SQL Editor
Data: 2025-01-22
=====================================================
*/

-- 1. Adicionar campo hora na tabela appointments (se não existir)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS hora TEXT;

-- 2. Atualizar dados existentes com o campo hora
-- Extrair a hora do campo date existente
UPDATE public.appointments 
SET hora = TO_CHAR(CAST(date AS time), 'HH24:MI')
WHERE hora IS NULL;

-- 3. Verificar se existe constraint única (não vamos criar por enquanto)
-- A verificação de duplicidade é feita no frontend antes da inserção
SELECT 
    'Constraints existentes' as tipo,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'appointments'
AND constraint_type = 'UNIQUE';

-- 4. Verificar se a estrutura foi aplicada corretamente
SELECT 
    'Estrutura appointments' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments'
AND column_name IN ('date', 'hora', 'user_id')
ORDER BY column_name;

-- 5. Verificar estrutura completa da tabela
SELECT 
    'Estrutura completa appointments' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- 6. Mostrar alguns exemplos de dados
SELECT 
    'Dados de exemplo' as tipo,
    id,
    date,
    hora,
    user_id,
    status
FROM public.appointments 
LIMIT 5;

/*
=====================================================
FIM DO SCRIPT
=====================================================
*/
