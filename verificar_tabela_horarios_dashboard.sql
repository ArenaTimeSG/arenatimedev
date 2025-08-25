-- =====================================================
-- Verificar tabela de horários da dashboard
-- =====================================================

-- 1. Verificar todas as tabelas do sistema
SELECT 
    'Todas as tabelas' as tipo,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar tabelas que podem ser de horários/dias
SELECT 
    'Possíveis tabelas de horários' as tipo,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%hora%' OR 
    table_name ILIKE '%time%' OR 
    table_name ILIKE '%schedule%' OR
    table_name ILIKE '%working%' OR
    table_name ILIKE '%dia%' OR
    table_name ILIKE '%day%' OR
    table_name ILIKE '%availability%' OR
    table_name ILIKE '%slot%'
)
ORDER BY table_name;

-- 3. Verificar estrutura da tabela que parece ser de horários
-- Substitua 'NOME_DA_TABELA' pelo nome real da tabela de horários
SELECT 
    'Estrutura da tabela de horários' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'working_hours'  -- ⚠️ ALTERE AQUI: coloque o nome da tabela
ORDER BY ordinal_position;

-- 4. Verificar dados da tabela de horários
-- Substitua 'NOME_DA_TABELA' pelo nome real da tabela de horários
SELECT 
    'Dados da tabela de horários' as tipo,
    *
FROM working_hours  -- ⚠️ ALTERE AQUI: coloque o nome da tabela
LIMIT 10;

-- 5. Verificar se existe relação com appointments
SELECT 
    'Relação com appointments' as tipo,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'appointments'
AND column_name ILIKE '%hora%'
ORDER BY column_name;
