-- Script para adicionar telefone na conta stimmmemontenegro@gmail.com
-- Execute este script no Supabase SQL Editor

DO $$
DECLARE
    _user_id UUID := 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f'; -- user_id da conta stimmmemontenegro@gmail.com
    _user_email TEXT := 'stimmmemontenegro@gmail.com';
    _user_name TEXT := 'GINASIO TANINAO';
    _user_phone TEXT := '5136321597';
BEGIN
    RAISE NOTICE '🔍 Adicionando telefone para: % (user_id: %)', _user_email, _user_id;
    
    -- 1. Atualizar o telefone no raw_user_meta_data do auth.users
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        raw_user_meta_data,
        '{phone}',
        to_jsonb(_user_phone),
        true
    ),
    updated_at = NOW()
    WHERE id = _user_id;

    RAISE NOTICE '✅ Telefone atualizado no raw_user_meta_data do auth.users';

    -- 2. Verificar se existe perfil em user_profiles
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = _user_id) THEN
        -- Atualizar perfil existente
        UPDATE public.user_profiles
        SET
            phone = _user_phone,
            updated_at = NOW()
        WHERE user_id = _user_id;
        RAISE NOTICE '✅ Telefone atualizado na tabela user_profiles';
    ELSE
        -- Criar novo perfil se não existir
        INSERT INTO public.user_profiles (user_id, name, username, phone)
        VALUES (
            _user_id,
            _user_name,
            LOWER(REPLACE(REPLACE(_user_name, ' ', '-'), '.', '')), -- Gerar username baseado no nome
            _user_phone
        );
        RAISE NOTICE '✅ Novo perfil criado na tabela user_profiles com telefone';
    END IF;

    -- 3. Verificar se existe configurações em settings
    IF EXISTS (SELECT 1 FROM public.settings WHERE user_id = _user_id) THEN
        -- Atualizar personal_data nas configurações
        UPDATE public.settings
        SET
            personal_data = jsonb_set(
                COALESCE(personal_data, '{}'::jsonb),
                '{phone}',
                to_jsonb(_user_phone),
                true
            ),
            updated_at = NOW()
        WHERE user_id = _user_id;
        RAISE NOTICE '✅ Telefone atualizado nas configurações (settings)';
    END IF;

END $$;

-- 4. Verificar se a atualização funcionou
SELECT 
    'VERIFICAÇÃO FINAL:' as info,
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'name' as nome_auth,
    u.raw_user_meta_data->>'phone' as phone_auth,
    p.username,
    p.name as nome_profile,
    p.phone as phone_profile,
    s.personal_data->>'phone' as phone_settings
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
LEFT JOIN public.settings s ON u.id = s.user_id
WHERE u.email = 'stimmmemontenegro@gmail.com';
