-- =====================================================
-- Testar conexão do frontend com o banco
-- =====================================================

-- 1. Verificar se o usuário atual tem perfil
SELECT 
    'Usuário atual' as tipo,
    au.id as user_id,
    au.email,
    up.username,
    up.name,
    up.is_active,
    up.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.email ILIKE '%pedrogreef%'
ORDER BY au.created_at DESC
LIMIT 1;

-- 2. Verificar políticas RLS para user_profiles
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 3. Testar acesso direto (simular frontend)
-- Primeiro, vamos pegar o ID do usuário
DO $$
DECLARE
    user_id UUID;
    profile_count INTEGER;
BEGIN
    -- Pegar o ID do usuário
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email ILIKE '%pedrogreef%'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário encontrado: %', user_id;
        
        -- Testar acesso direto
        SELECT COUNT(*) INTO profile_count
        FROM public.user_profiles 
        WHERE user_id = user_id;
        
        RAISE NOTICE 'Perfis encontrados para este usuário: %', profile_count;
        
        -- Mostrar dados do perfil
        IF profile_count > 0 THEN
            RAISE NOTICE 'Dados do perfil:';
            FOR r IN 
                SELECT username, name, is_active, created_at
                FROM public.user_profiles 
                WHERE user_id = user_id
            LOOP
                RAISE NOTICE 'Username: %, Nome: %, Ativo: %, Criado: %', 
                    r.username, r.name, r.is_active, r.created_at;
            END LOOP;
        ELSE
            RAISE NOTICE 'Nenhum perfil encontrado para este usuário';
        END IF;
        
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado';
    END IF;
END $$;

-- 4. Verificar se há problemas de permissão
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 5. Verificar grants
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_profiles'
ORDER BY grantee, privilege_type;
