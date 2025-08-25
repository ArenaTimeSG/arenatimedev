-- =====================================================
-- Verificar working_hours na tabela settings
-- =====================================================

-- 1. Verificar estrutura da tabela settings
SELECT 
    'Estrutura settings' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- 2. Verificar dados de working_hours na settings
SELECT 
    'Working hours na settings' as tipo,
    user_id,
    working_hours,
    created_at
FROM settings
WHERE working_hours IS NOT NULL
LIMIT 5;

-- 3. Verificar um registro específico de working_hours
SELECT 
    'Exemplo working_hours' as tipo,
    working_hours::text as working_hours_json
FROM settings
WHERE working_hours IS NOT NULL
LIMIT 1;

-- 4. Verificar se existe campo hora separado na appointments
SELECT 
    'Campo hora em appointments' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments'
AND column_name IN ('date', 'hora', 'horario', 'time')
ORDER BY column_name;

-- 5. Verificar dados de exemplo na appointments
SELECT 
    'Dados appointments' as tipo,
    id,
    date,
    modality,
    status,
    user_id
FROM appointments
ORDER BY date DESC
LIMIT 5;
