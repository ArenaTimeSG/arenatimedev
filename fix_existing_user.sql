-- =====================================================
-- Corrigir usuário existente ou permitir login
-- =====================================================

-- Opção 1: Atualizar o perfil existente com username
-- (Execute apenas se o usuário quiser manter a conta existente)

-- Primeiro, vamos verificar o usuário atual
DO $$
DECLARE
    user_record RECORD;
    profile_record RECORD;
BEGIN
    -- Buscar o usuário no auth.users
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE email ILIKE '%pedrogreef06%' OR email ILIKE '%PEDROGREEF06%';
    
    IF user_record.id IS NOT NULL THEN
        RAISE NOTICE 'Usuário encontrado no auth.users: %', user_record.email;
        
        -- Buscar o perfil correspondente
        SELECT * INTO profile_record 
        FROM public.user_profiles 
        WHERE user_id = user_record.id;
        
        IF profile_record.id IS NOT NULL THEN
            RAISE NOTICE 'Perfil encontrado: % - Username atual: %', profile_record.name, profile_record.username;
            
            -- Atualizar o username se estiver vazio
            IF profile_record.username IS NULL OR profile_record.username = '' THEN
                UPDATE public.user_profiles 
                SET username = 'p3droo6'
                WHERE user_id = user_record.id;
                
                RAISE NOTICE 'Username atualizado para: p3droo6';
            ELSE
                RAISE NOTICE 'Username já existe: %', profile_record.username;
            END IF;
            
        ELSE
            RAISE NOTICE 'Perfil não encontrado para o usuário %', user_record.id;
            
            -- Criar o perfil se não existir
            INSERT INTO public.user_profiles (
                user_id,
                name,
                email,
                phone,
                username,
                role,
                is_active
            ) VALUES (
                user_record.id,
                'PEDRO JUNIOR GREEF FLORES',
                user_record.email,
                NULL,
                'p3droo6',
                'user',
                true
            );
            
            RAISE NOTICE 'Perfil criado com username: p3droo6';
        END IF;
        
    ELSE
        RAISE NOTICE 'Usuário não encontrado no auth.users';
    END IF;
END $$;

-- Opção 2: Remover o usuário existente para permitir novo cadastro
-- (Execute apenas se o usuário quiser criar uma nova conta)

-- DESCOMENTE AS LINHAS ABAIXO SE QUISER REMOVER O USUÁRIO EXISTENTE:
/*
-- Remover perfil primeiro (devido à foreign key)
DELETE FROM public.user_profiles 
WHERE email ILIKE '%pedrogreef06%' OR email ILIKE '%PEDROGREEF06%';

-- Remover usuário do auth
DELETE FROM auth.users 
WHERE email ILIKE '%pedrogreef06%' OR email ILIKE '%PEDROGREEF06%';

RAISE NOTICE 'Usuário removido. Agora é possível fazer novo cadastro.';
*/

-- Verificar resultado final
SELECT 
    up.id,
    up.user_id,
    up.name,
    up.email,
    up.username,
    up.role,
    up.is_active,
    up.created_at,
    au.email_confirmed_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE up.email ILIKE '%pedrogreef06%' OR up.email ILIKE '%PEDROGREEF06%'
ORDER BY up.created_at DESC;
