-- Script para verificar e corrigir configurações pessoais
-- As informações pessoais não estão aparecendo na página de configurações

-- 1. Verificar configurações do usuário
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
        ELSE 'TEM_DADOS'
    END as status_personal_data,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 3. Se personal_data estiver vazio, atualizar com dados do usuário
-- (Execute apenas se personal_data estiver NULL ou vazio)
UPDATE settings 
SET 
    personal_data = jsonb_build_object(
        'name', 'GINASIO TANINAO',
        'email', 'PEDROGREEF06@GMAIL.COM',
        'phone', '(11) 99999-9999'
    ),
    updated_at = NOW()
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'
AND (personal_data IS NULL OR personal_data = '{}');

-- 4. Verificar se a atualização funcionou
SELECT 
    id,
    user_id,
    personal_data,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 5. Verificar se há perfil na tabela user_profiles também
SELECT 
    id,
    user_id,
    name,
    email,
    phone,
    role,
    is_active,
    created_at
FROM user_profiles 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 6. Se não houver perfil, criar um
-- (Execute apenas se não houver perfil)
-- INSERT INTO public.user_profiles (
--     user_id,
--     name,
--     email,
--     phone,
--     role,
--     is_active
-- ) VALUES (
--     'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f',
--     'GINASIO TANINAO',
--     'PEDROGREEF06@GMAIL.COM',
--     '(11) 99999-9999',
--     'admin',
--     true
-- );
