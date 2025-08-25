-- =====================================================
-- Ativar agendamento online para o usuário teste
-- =====================================================

-- 1. Verificar configurações atuais
SELECT 'Configurações atuais:' as info;
SELECT 
    id,
    user_id,
    working_hours,
    default_interval,
    theme,
    created_at,
    updated_at
FROM public.settings 
WHERE user_id = (
    SELECT user_id FROM public.user_profiles WHERE name = 'teste'
);

-- 2. Atualizar configurações para ativar agendamento online
UPDATE public.settings 
SET 
    working_hours = '{
        "monday": {"enabled": true, "start": "08:00", "end": "18:00"},
        "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"},
        "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"},
        "thursday": {"enabled": true, "start": "08:00", "end": "18:00"},
        "friday": {"enabled": true, "start": "08:00", "end": "18:00"},
        "saturday": {"enabled": true, "start": "08:00", "end": "18:00"},
        "sunday": {"enabled": false, "start": "08:00", "end": "18:00"}
    }'::jsonb,
    default_interval = 60,
    theme = 'light',
    updated_at = NOW()
WHERE user_id = (
    SELECT user_id FROM public.user_profiles WHERE name = 'teste'
);

-- 3. Verificar se a atualização foi bem-sucedida
SELECT 'Configurações após atualização:' as info;
SELECT 
    id,
    user_id,
    working_hours,
    default_interval,
    theme,
    created_at,
    updated_at
FROM public.settings 
WHERE user_id = (
    SELECT user_id FROM public.user_profiles WHERE name = 'teste'
);

-- 4. Verificar usuário teste
SELECT 'Usuário teste:' as info;
SELECT 
    id,
    user_id,
    name,
    role,
    is_active,
    created_at
FROM public.user_profiles 
WHERE name = 'teste';
