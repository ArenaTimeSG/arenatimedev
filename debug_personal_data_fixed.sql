-- Script para verificar exatamente o que está em personal_data
-- Corrigir erro de array_length para personal_data que é um objeto

-- 1. Verificar o conteúdo exato de personal_data
SELECT 
    id,
    user_id,
    personal_data,
    jsonb_typeof(personal_data) as tipo_personal_data,
    personal_data::text as personal_data_texto,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 2. Verificar se personal_data tem as chaves corretas
SELECT 
    id,
    user_id,
    personal_data->>'name' as name_value,
    personal_data->>'email' as email_value,
    personal_data->>'phone' as phone_value,
    personal_data->'name' as name_object,
    personal_data->'email' as email_object,
    personal_data->'phone' as phone_object,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 3. Verificar se personal_data é um objeto vazio {}
SELECT 
    id,
    user_id,
    personal_data,
    CASE 
        WHEN personal_data IS NULL THEN 'NULL'
        WHEN personal_data = '{}' THEN 'OBJETO_VAZIO'
        WHEN personal_data = 'null' THEN 'STRING_NULL'
        WHEN personal_data = '[]' THEN 'ARRAY_VAZIO'
        ELSE 'TEM_CONTEUDO'
    END as status_personal_data,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 4. FORÇAR atualização com dados corretos (garantir que não seja objeto vazio)
UPDATE settings 
SET 
    personal_data = jsonb_build_object(
        'name', 'GINASIO TANINAO',
        'email', 'PEDROGREEF06@GMAIL.COM',
        'phone', '(11) 99999-9999'
    ),
    updated_at = NOW()
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 5. Verificar se a atualização funcionou
SELECT 
    id,
    user_id,
    personal_data,
    personal_data->>'name' as name_value,
    personal_data->>'email' as email_value,
    personal_data->>'phone' as phone_value,
    created_at,
    updated_at
FROM settings 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';
