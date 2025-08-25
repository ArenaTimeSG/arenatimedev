-- =====================================================
-- Verificar tabela de horários existente na dashboard
-- =====================================================

-- 1. Verificar todas as tabelas que podem ser de horários
SELECT 
    'Todas as tabelas' as tipo,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%hora%'
ORDER BY table_name;

-- 2. Verificar tabelas que podem conter horários
SELECT 
    'Tabelas com horários' as tipo,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%hora%' OR 
    table_name ILIKE '%time%' OR 
    table_name ILIKE '%schedule%' OR
    table_name ILIKE '%working%'
)
ORDER BY table_name;

-- 3. Verificar estrutura da tabela que parece ser de horários
-- Substitua 'NOME_DA_TABELA' pelo nome real da tabela
SELECT 
    'Estrutura da tabela' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'working_hours'  -- ⚠️ ALTERE AQUI: coloque o nome da tabela
ORDER BY ordinal_position;

-- 4. Verificar dados da tabela de horários
-- Substitua 'NOME_DA_TABELA' pelo nome real da tabela
SELECT 
    'Dados da tabela' as tipo,
    *
FROM working_hours  -- ⚠️ ALTERE AQUI: coloque o nome da tabela
LIMIT 10;

-- 5. Verificar se existe tabela settings com working_hours
SELECT 
    'Settings com working_hours' as tipo,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'settings'
AND column_name ILIKE '%hora%'
ORDER BY column_name;
