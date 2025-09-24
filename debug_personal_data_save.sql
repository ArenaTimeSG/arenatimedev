-- Script para verificar se os dados pessoais estão sendo salvos corretamente
-- Execute este script após tentar salvar na página Settings

-- 1. Verificar o conteúdo atual de personal_data na tabela settings
SELECT
    id,
    user_id,
    personal_data,
    personal_data->>'name' as name_value,
    personal_data->>'email' as email_value,
    personal_data->>'phone' as phone_value,
    created_at,
    updated_at
FROM public.settings
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 2. Verificar se existe entrada na tabela user_profiles
SELECT
    user_id,
    name,
    phone,
    created_at,
    updated_at
FROM public.user_profiles
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 3. Verificar dados do auth.users (se possível)
-- Nota: Esta tabela é gerenciada pelo Supabase Auth, mas podemos verificar se há inconsistências
SELECT
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'name' as name_from_metadata,
    raw_user_meta_data->>'phone' as phone_from_metadata,
    created_at,
    updated_at
FROM auth.users
WHERE id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f';

-- 4. Comparar timestamps para ver qual foi atualizado mais recentemente
SELECT
    'settings' as tabela,
    updated_at,
    personal_data->>'name' as name_value
FROM public.settings
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'

UNION ALL

SELECT
    'user_profiles' as tabela,
    updated_at,
    name as name_value
FROM public.user_profiles
WHERE user_id = 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'

ORDER BY updated_at DESC;
