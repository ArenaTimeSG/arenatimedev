-- Script para corrigir o username do usuário pedrogreef06@gmail.com
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o usuário atual
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'name' as nome,
    p.username,
    p.name as profile_name
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'pedrogreef06@gmail.com';

-- 2. Atualizar ou criar o username na tabela user_profiles
DO $$
DECLARE
    _user_id UUID;
    _username TEXT;
BEGIN
    -- Buscar o user_id do email
    SELECT id INTO _user_id 
    FROM auth.users 
    WHERE email = 'pedrogreef06@gmail.com';
    
    IF _user_id IS NOT NULL THEN
        -- Gerar username baseado no nome (p3droo6)
        _username := 'p3droo6';
        
        -- Verificar se já existe um perfil
        IF EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = _user_id) THEN
            -- Atualizar username existente
            UPDATE public.user_profiles 
            SET 
                username = _username,
                updated_at = NOW()
            WHERE user_id = _user_id;
            
            RAISE NOTICE '✅ Username atualizado para o usuário %: %', _user_id, _username;
        ELSE
            -- Criar novo perfil com username
            INSERT INTO public.user_profiles (user_id, name, username, phone)
            VALUES (
                _user_id,
                'Pedro Junior Greef Flores',
                _username,
                '51997982724'
            );
            
            RAISE NOTICE '✅ Perfil criado para o usuário % com username: %', _user_id, _username;
        END IF;
    ELSE
        RAISE NOTICE '❌ Usuário com email pedrogreef06@gmail.com não encontrado';
    END IF;
END $$;

-- 3. Verificar se a correção funcionou
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'name' as nome,
    p.username,
    p.name as profile_name,
    p.phone,
    p.created_at,
    p.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'pedrogreef06@gmail.com';

-- 4. Verificar se o link de agendamento está correto
SELECT 
    'Link de agendamento esperado:' as info,
    'https://arenatime.com/booking/p3droo6' as link_esperado;
