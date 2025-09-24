-- Script para corrigir os dados pessoais com valores corretos
-- O nome está aparecendo duplicado e precisa ser corrigido

-- 1. Verificar dados atuais
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

-- 2. CORRIGIR com dados corretos (sem duplicação)
UPDATE settings 
SET 
    personal_data = jsonb_build_object(
        'name', 'GINASIO TANINAO',
        'email', 'PEDROGREEF06@GMAIL.COM',
        'phone', '(11) 99999-9999'
    ),
    updated_at = NOW()
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 3. Verificar se a correção funcionou
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

-- 4. Verificar também a tabela user_profiles para comparar
SELECT 
    id,
    user_id,
    name,
    phone,
    created_at
FROM user_profiles 
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';
