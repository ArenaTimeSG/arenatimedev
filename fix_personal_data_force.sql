-- Script para verificar e corrigir definitivamente as configurações pessoais
-- A página Settings busca dados em settings.personal_data, não em user_profiles

-- 1. Verificar configurações atuais do usuário
SELECT 
    id,
    user_id,
    personal_data,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 2. Verificar se personal_data está vazio ou null
SELECT 
    id,
    user_id,
    personal_data,
    CASE 
        WHEN personal_data IS NULL THEN 'NULL'
        WHEN personal_data = '{}' THEN 'VAZIO'
        WHEN personal_data = 'null' THEN 'STRING_NULL'
        ELSE 'TEM_DADOS'
    END as status_personal_data,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 3. FORÇAR atualização de personal_data com dados corretos
UPDATE settings 
SET 
    personal_data = jsonb_build_object(
        'name', 'GINASIO TANINAO',
        'email', 'PEDROGREEF06@GMAIL.COM',
        'phone', '(11) 99999-9999'
    ),
    updated_at = NOW()
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 4. Verificar se a atualização funcionou
SELECT 
    id,
    user_id,
    personal_data,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 5. Verificar se há outras configurações que podem estar interferindo
SELECT 
    id,
    user_id,
    personal_data,
    working_hours,
    online_enabled,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 6. Se ainda não funcionar, criar configurações do zero
-- (Execute apenas se não houver configurações)
-- INSERT INTO public.settings (
--     user_id,
--     personal_data,
--     working_hours,
--     online_enabled,
--     created_at,
--     updated_at
-- ) VALUES (
--     'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f',
--     jsonb_build_object(
--         'name', 'GINASIO TANINAO',
--         'email', 'PEDROGREEF06@GMAIL.COM',
--         'phone', '(11) 99999-9999'
--     ),
--     jsonb_build_object(
--         'monday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
--         'tuesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
--         'wednesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
--         'thursday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
--         'friday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
--         'saturday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
--         'sunday', jsonb_build_object('enabled', false, 'start', '08:00', 'end', '18:00')
--     ),
--     true,
--     NOW(),
--     NOW()
-- );
