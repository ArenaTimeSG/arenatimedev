-- =====================================================
-- Verificar estrutura da tabela schedules
-- =====================================================

-- 1. Verificar estrutura da tabela schedules
SELECT 
    'Estrutura schedules' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'schedules'
ORDER BY ordinal_position;

-- 2. Verificar dados da tabela schedules
SELECT 
    'Dados schedules' as tipo,
    *
FROM schedules
LIMIT 10;

-- 3. Verificar quantos registros existem
SELECT 
    'Contagem schedules' as tipo,
    COUNT(*) as total_registros
FROM schedules;

-- 4. Verificar se há relação com user_id
SELECT 
    'Schedules por usuário' as tipo,
    user_id,
    COUNT(*) as total_schedules
FROM schedules
GROUP BY user_id
ORDER BY total_schedules DESC;

-- 5. Verificar estrutura da tabela appointments
SELECT 
    'Estrutura appointments' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- 6. Verificar se appointments tem campo hora
SELECT 
    'Campo hora em appointments' as tipo,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'appointments'
AND column_name IN ('date', 'hora', 'horario', 'time')
ORDER BY column_name;
