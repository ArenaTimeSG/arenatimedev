-- Script para corrigir a conta pedrogreef06@gmail.com usando o user_id correto
-- Execute este script no Supabase SQL Editor

DO $$
DECLARE
    _user_id UUID := '52ef6c9b-fa0a-4444-a35d-a4729f9541a6'; -- user_id da conta pedrogreef06@gmail.com
    _username TEXT := 'p3droo6';
    _user_email TEXT := 'pedrogreef06@gmail.com';
    _user_name TEXT := 'Pedro Junior Greef Flores';
    _user_phone TEXT := '51997982724';
BEGIN
    RAISE NOTICE '🔍 Corrigindo conta: % (user_id: %)', _user_email, _user_id;
    
    -- 1. Verificar se já existe um perfil para este user_id
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = _user_id) THEN
        -- Atualizar perfil existente
        UPDATE public.user_profiles
        SET
            username = _username,
            name = _user_name,
            phone = _user_phone,
            updated_at = NOW()
        WHERE user_id = _user_id;
        RAISE NOTICE '✅ Perfil atualizado na tabela user_profiles';
    ELSE
        -- Criar novo perfil
        INSERT INTO public.user_profiles (user_id, name, username, phone)
        VALUES (
            _user_id,
            _user_name,
            _username,
            _user_phone
        );
        RAISE NOTICE '✅ Novo perfil criado na tabela user_profiles';
    END IF;

    -- 2. Verificar se existe configurações
    IF NOT EXISTS (SELECT 1 FROM public.settings WHERE user_id = _user_id) THEN
        -- Criar configurações padrão
        INSERT INTO public.settings (
            user_id,
            online_enabled,
            online_booking,
            working_hours,
            payment_policy,
            time_format_interval,
            personal_data
        ) VALUES (
            _user_id,
            true, -- online_enabled
            '{"auto_agendar": false, "tempo_minimo_antecedencia": 24, "duracao_padrao": 60}'::jsonb, -- online_booking
            '{"monday": {"enabled": true, "start": "08:00", "end": "18:00"}, "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"}, "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"}, "thursday": {"enabled": true, "start": "08:00", "end": "18:00"}, "friday": {"enabled": true, "start": "08:00", "end": "18:00"}, "saturday": {"enabled": true, "start": "08:00", "end": "18:00"}, "sunday": {"enabled": false, "start": "08:00", "end": "18:00"}}'::jsonb, -- working_hours
            'sem_pagamento', -- payment_policy
            60, -- time_format_interval
            '{"name": "Pedro Junior Greef Flores", "email": "pedrogreef06@gmail.com", "phone": "51997982724"}'::jsonb -- personal_data
        );
        RAISE NOTICE '✅ Configurações padrão criadas na tabela settings';
    ELSE
        -- Atualizar configurações existentes para garantir que online_enabled está true
        UPDATE public.settings
        SET
            online_enabled = true,
            personal_data = '{"name": "Pedro Junior Greef Flores", "email": "pedrogreef06@gmail.com", "phone": "51997982724"}'::jsonb,
            updated_at = NOW()
        WHERE user_id = _user_id;
        RAISE NOTICE '✅ Configurações atualizadas na tabela settings';
    END IF;

    -- 3. Atualizar também o raw_user_meta_data do auth.users para consistência
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        jsonb_set(
            raw_user_meta_data,
            '{name}',
            to_jsonb(_user_name),
            true
        ),
        '{phone}',
        to_jsonb(_user_phone),
        true
    ),
    updated_at = NOW()
    WHERE id = _user_id;

    RAISE NOTICE '✅ raw_user_meta_data atualizado em auth.users';

END $$;

-- 4. Verificar se a correção funcionou
SELECT 
    'VERIFICAÇÃO FINAL:' as info,
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'name' as nome_auth,
    u.raw_user_meta_data->>'phone' as phone_auth,
    p.username,
    p.name as nome_profile,
    p.phone as phone_profile,
    s.online_enabled,
    s.personal_data->>'name' as nome_settings,
    s.personal_data->>'phone' as phone_settings
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
LEFT JOIN public.settings s ON u.id = s.user_id
WHERE u.email = 'pedrogreef06@gmail.com';

-- 5. Mostrar o link de agendamento esperado
SELECT 
    'LINK DE AGENDAMENTO:' as info,
    'https://arenatime.com/booking/p3droo6' as link_producao,
    'https://arenatime.vercel.app/booking/p3droo6' as link_vercel,
    'http://localhost:5173/booking/p3droo6' as link_local;
