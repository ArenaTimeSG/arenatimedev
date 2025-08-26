-- =====================================================
-- MIGRAÇÃO MANUAL: ADICIONAR CAMPOS DE AGENDAMENTO ONLINE
-- Execute este script no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Adicionar campo online_enabled
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS online_enabled BOOLEAN DEFAULT false;

-- 2. Adicionar campo online_booking
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS online_booking JSONB DEFAULT jsonb_build_object(
    'auto_agendar', false,
    'tempo_minimo_antecedencia', 24,
    'duracao_padrao', 60
);

-- 3. Adicionar campo working_hours (se não existir)
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT jsonb_build_object(
    'monday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'tuesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'wednesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'thursday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'friday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'saturday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'sunday', jsonb_build_object('enabled', false, 'start', '08:00', 'end', '18:00')
);

-- 4. Atualizar configurações existentes com valores padrão
UPDATE public.settings 
SET 
    online_enabled = COALESCE(online_enabled, false),
    online_booking = COALESCE(online_booking, jsonb_build_object(
        'auto_agendar', false,
        'tempo_minimo_antecedencia', 24,
        'duracao_padrao', 60
    )),
    working_hours = COALESCE(working_hours, jsonb_build_object(
        'monday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
        'tuesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
        'wednesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
        'thursday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
        'friday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
        'saturday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
        'sunday', jsonb_build_object('enabled', false, 'start', '08:00', 'end', '18:00')
    ))
WHERE online_enabled IS NULL 
   OR online_booking IS NULL 
   OR working_hours IS NULL;

-- 5. Verificar se os campos foram adicionados corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'settings'
AND column_name IN ('online_enabled', 'online_booking', 'working_hours')
ORDER BY column_name;

-- 6. Mostrar algumas configurações para verificar
SELECT 
    user_id, 
    online_enabled, 
    online_booking,
    working_hours
FROM public.settings
LIMIT 3;
