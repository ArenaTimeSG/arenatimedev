-- =====================================================
-- SCRIPT DE TESTE DO SISTEMA DE AGENDAMENTO ONLINE
-- Execute este script para verificar se tudo está funcionando
-- =====================================================

-- 1. VERIFICAR SE AS TABELAS EXISTEM
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO TABELAS ===';
    
    -- Verificar tabela modalities
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modalities') THEN
        RAISE NOTICE '✅ Tabela modalities existe';
    ELSE
        RAISE NOTICE '❌ Tabela modalities NÃO existe';
    END IF;
    
    -- Verificar tabela booking_clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_clients') THEN
        RAISE NOTICE '✅ Tabela booking_clients existe';
    ELSE
        RAISE NOTICE '❌ Tabela booking_clients NÃO existe';
    END IF;
    
    -- Verificar campo online_enabled em settings
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'online_enabled'
    ) THEN
        RAISE NOTICE '✅ Campo online_enabled existe em settings';
    ELSE
        RAISE NOTICE '❌ Campo online_enabled NÃO existe em settings';
    END IF;
    
    -- Verificar campo user_id em appointments
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE '✅ Campo user_id existe em appointments';
    ELSE
        RAISE NOTICE '❌ Campo user_id NÃO existe em appointments';
    END IF;
    
    -- Verificar campo username em user_profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'username'
    ) THEN
        RAISE NOTICE '✅ Campo username existe em user_profiles';
    ELSE
        RAISE NOTICE '❌ Campo username NÃO existe em user_profiles';
    END IF;
END $$;

-- 2. VERIFICAR POLÍTICAS RLS
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO POLÍTICAS RLS ===';
    
    -- Verificar políticas de modalities
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modalities') THEN
        RAISE NOTICE '✅ Políticas RLS existem para modalities';
    ELSE
        RAISE NOTICE '❌ Políticas RLS NÃO existem para modalities';
    END IF;
    
    -- Verificar políticas de booking_clients
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_clients') THEN
        RAISE NOTICE '✅ Políticas RLS existem para booking_clients';
    ELSE
        RAISE NOTICE '❌ Políticas RLS NÃO existem para booking_clients';
    END IF;
    
    -- Verificar políticas de appointments
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments') THEN
        RAISE NOTICE '✅ Políticas RLS existem para appointments';
    ELSE
        RAISE NOTICE '❌ Políticas RLS NÃO existem para appointments';
    END IF;
    
    -- Verificar políticas de user_profiles
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles') THEN
        RAISE NOTICE '✅ Políticas RLS existem para user_profiles';
    ELSE
        RAISE NOTICE '❌ Políticas RLS NÃO existem para user_profiles';
    END IF;
    
    -- Verificar políticas de settings
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings') THEN
        RAISE NOTICE '✅ Políticas RLS existem para settings';
    ELSE
        RAISE NOTICE '❌ Políticas RLS NÃO existem para settings';
    END IF;
END $$;

-- 3. VERIFICAR DADOS EXISTENTES
DO $$
DECLARE
    user_count INTEGER;
    settings_count INTEGER;
    modalities_count INTEGER;
    username_count INTEGER;
    username_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICANDO DADOS EXISTENTES ===';
    
    -- Contar usuários
    SELECT COUNT(*) INTO user_count FROM public.user_profiles;
    RAISE NOTICE 'Usuários cadastrados: %', user_count;
    
    -- Contar configurações
    SELECT COUNT(*) INTO settings_count FROM public.settings;
    RAISE NOTICE 'Configurações cadastradas: %', settings_count;
    
    -- Contar modalidades
    SELECT COUNT(*) INTO modalities_count FROM public.modalities;
    RAISE NOTICE 'Modalidades cadastradas: %', modalities_count;
    
    -- Contar usuários com username
    SELECT COUNT(*) INTO username_count FROM public.user_profiles WHERE username IS NOT NULL;
    RAISE NOTICE 'Usuários com username: %', username_count;
    
    -- Mostrar usernames disponíveis
    RAISE NOTICE 'Usernames disponíveis:';
    FOR username_record IN 
        SELECT username FROM public.user_profiles WHERE username IS NOT NULL LIMIT 5
    LOOP
        RAISE NOTICE '  - %', username_record.username;
    END LOOP;
END $$;

-- 4. TESTAR INSERÇÃO DE MODALIDADE (se houver usuários)
DO $$
DECLARE
    test_user_id UUID;
    test_modality_id UUID;
BEGIN
    RAISE NOTICE '=== TESTANDO INSERÇÃO DE MODALIDADE ===';
    
    -- Pegar primeiro usuário
    SELECT user_id INTO test_user_id FROM public.user_profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Inserir modalidade de teste
        INSERT INTO public.modalities (user_id, name, valor)
        VALUES (test_user_id, 'Futebol Teste', 50.00)
        RETURNING id INTO test_modality_id;
        
        RAISE NOTICE '✅ Modalidade de teste inserida com ID: %', test_modality_id;
        
        -- Verificar se foi inserida
        IF EXISTS (SELECT 1 FROM public.modalities WHERE id = test_modality_id) THEN
            RAISE NOTICE '✅ Modalidade confirmada no banco';
        ELSE
            RAISE NOTICE '❌ Modalidade NÃO encontrada no banco';
        END IF;
        
        -- Remover modalidade de teste
        DELETE FROM public.modalities WHERE id = test_modality_id;
        RAISE NOTICE '✅ Modalidade de teste removida';
    ELSE
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 5. VERIFICAR CONFIGURAÇÕES DE EXEMPLO
DO $$
DECLARE
    config_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICANDO CONFIGURAÇÕES ===';
    
    FOR config_record IN 
        SELECT s.user_id, s.online_enabled, up.name as user_name
        FROM public.settings s
        JOIN public.user_profiles up ON s.user_id = up.user_id
        LIMIT 3
    LOOP
        RAISE NOTICE 'Usuário: % | Online enabled: %', config_record.user_name, config_record.online_enabled;
    END LOOP;
END $$;

-- 6. RESUMO FINAL
DO $$
BEGIN
    RAISE NOTICE '=== RESUMO DO SISTEMA ===';
    RAISE NOTICE 'Se todas as verificações acima mostraram ✅, o sistema está configurado corretamente!';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Execute o script setup_complete_system.sql se alguma verificação falhou';
    RAISE NOTICE '2. Teste o agendamento online acessando /agendar/:username';
    RAISE NOTICE '3. Verifique se as modalidades aparecem corretamente';
    RAISE NOTICE '4. Teste o login de clientes e criação de agendamentos';
END $$;
