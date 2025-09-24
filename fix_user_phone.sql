-- Script para atualizar o telefone do usuário
-- Execute este script no Supabase SQL Editor

-- 1. Atualizar telefone na tabela user_profiles
UPDATE public.user_profiles
SET 
    phone = '51997982724',
    updated_at = NOW()
WHERE user_id = '9e470db5-d03b-4c5e-a571-15d95c54607d';

-- 2. Verificar se a atualização funcionou
SELECT
    user_id,
    name,
    phone,
    username,
    updated_at
FROM public.user_profiles
WHERE user_id = '9e470db5-d03b-4c5e-a571-15d95c54607d';

-- 3. Opcional: Atualizar também no auth.users (se necessário)
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"phone": "51997982724"}'
-- WHERE id = '9e470db5-d03b-4c5e-a571-15d95c54607d';
