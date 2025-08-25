-- =====================================================
-- Criar usuário de teste simples
-- =====================================================

-- 1. Verificar usuários existentes na auth.users
SELECT 'Usuários na auth.users:' as info;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC
LIMIT 3;

-- 2. Se você tem usuários autenticados, usar o primeiro
-- Se não tiver, vamos criar um usuário de teste básico
DO $$
DECLARE
    existing_user_id UUID;
    test_user_id UUID;
BEGIN
    -- Tentar pegar o primeiro usuário da auth.users
    SELECT id INTO existing_user_id 
    FROM auth.users 
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Usar usuário existente
        test_user_id := existing_user_id;
        RAISE NOTICE 'Usando usuário existente: %', test_user_id;
        
        -- Verificar se já existe um perfil para este usuário
        IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = test_user_id) THEN
            -- Criar perfil para o usuário existente
            INSERT INTO public.user_profiles (
                user_id,
                name,
                email,
                role,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                test_user_id,
                'teste',
                'teste@arenatime.com',
                'admin',
                true,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Perfil criado para usuário existente';
        ELSE
            -- Atualizar perfil existente
            UPDATE public.user_profiles 
            SET name = 'teste', role = 'admin', is_active = true
            WHERE user_id = test_user_id;
            RAISE NOTICE 'Perfil atualizado para usuário existente';
        END IF;
        
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado na auth.users. Você precisa criar um usuário primeiro.';
        RETURN;
    END IF;
    
    -- Criar modalidades para este usuário
    -- Primeiro deletar modalidades existentes (se houver)
    DELETE FROM public.modalities WHERE user_id = test_user_id;
    
    -- Inserir novas modalidades
    INSERT INTO public.modalities (user_id, name, valor, created_at, updated_at)
    VALUES 
        (test_user_id, 'Futsal', 80.00, NOW(), NOW()),
        (test_user_id, 'Vôlei', 100.00, NOW(), NOW()),
        (test_user_id, 'Basquete', 90.00, NOW(), NOW()),
        (test_user_id, 'Tênis', 120.00, NOW(), NOW()),
        (test_user_id, 'Beach Tennis', 110.00, NOW(), NOW());
    
    RAISE NOTICE 'Modalidades criadas para o usuário teste';
    
END $$;

-- 3. Verificar o resultado
SELECT 'Usuário criado:' as info;
SELECT 
    id,
    user_id,
    name,
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles 
WHERE name = 'teste';

SELECT 'Modalidades criadas:' as info;
SELECT 
    m.id,
    m.name,
    m.valor,
    up.name as user_name
FROM public.modalities m
JOIN public.user_profiles up ON m.user_id = up.user_id
WHERE up.name = 'teste';

SELECT 'Contagem final:' as info;
SELECT 'user_profiles' as tabela, COUNT(*) as total FROM public.user_profiles
UNION ALL
SELECT 'modalities' as tabela, COUNT(*) as total FROM public.modalities;
