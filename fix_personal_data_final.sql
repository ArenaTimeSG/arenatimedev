-- Script para verificar e corrigir configurações pessoais
-- Verificar apenas colunas que existem na tabela user_profiles

-- 1. Verificar estrutura da tabela user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar configurações do usuário
SELECT 
    id,
    user_id,
    personal_data,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 3. Verificar se personal_data está vazio ou null
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

-- 4. Se personal_data estiver vazio, atualizar com dados do usuário
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

-- 5. Verificar se a atualização funcionou
SELECT 
    id,
    user_id,
    personal_data,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 6. Verificar se há perfil na tabela user_profiles (apenas colunas que existem)
SELECT 
    id,
    user_id,
    name,
    phone,
    is_active,
    created_at
FROM user_profiles 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 7. Se não houver perfil, criar um (apenas com colunas que existem)
-- (Execute apenas se não houver perfil)
-- INSERT INTO public.user_profiles (
--     user_id,
--     name,
--     phone,
--     is_active
-- ) VALUES (
--     'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f',
--     'GINASIO TANINAO',
--     '(11) 99999-9999',
--     true
-- );
