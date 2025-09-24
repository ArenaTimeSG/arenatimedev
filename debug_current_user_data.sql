-- Script para verificar dados pessoais salvos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar dados em settings.personal_data
SELECT
    id,
    user_id,
    personal_data,
    personal_data->>'name' as name_value,
    personal_data->>'email' as email_value,
    personal_data->>'phone' as phone_value,
    updated_at
FROM public.settings
WHERE user_id = '9e470db5-d03b-4c5e-a571-15d95c54607d';

-- 2. Verificar dados em user_profiles
SELECT
    user_id,
    name,
    phone,
    username,
    created_at,
    updated_at
FROM public.user_profiles
WHERE user_id = '9e470db5-d03b-4c5e-a571-15d95c54607d';

-- 3. Verificar dados em auth.users (se possível)
SELECT
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'name' as name_from_metadata,
    raw_user_meta_data->>'phone' as phone_from_metadata,
    created_at,
    updated_at
FROM auth.users
WHERE id = '9e470db5-d03b-4c5e-a571-15d95c54607d';
