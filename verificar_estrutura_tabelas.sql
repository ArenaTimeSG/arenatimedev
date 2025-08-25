-- =====================================================
-- Verificar estrutura das tabelas
-- =====================================================

-- 1. Verificar estrutura da tabela appointments
SELECT 
    'Estrutura appointments' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- 2. Verificar se existe tabela horarios
SELECT 
    'Tabelas existentes' as tipo,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('appointments', 'horarios')
ORDER BY table_name;

-- 3. Verificar dados de exemplo na appointments
SELECT 
    'Dados appointments' as tipo,
    id,
    date,
    modality,
    status,
    user_id,
    client_id
FROM appointments 
ORDER BY date DESC
LIMIT 5;

-- 4. Verificar se existe campo hora separado
SELECT 
    'Campos de data/hora' as tipo,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'appointments'
AND column_name IN ('date', 'hora', 'horario', 'time')
ORDER BY column_name;
