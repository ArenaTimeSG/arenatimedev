-- =====================================================
-- SCRIPT DE DEBUG - MODALIDADES E AGENDAMENTOS
-- Execute este script para verificar se tudo está funcionando
-- =====================================================

-- 1. VERIFICAR USUÁRIOS E USERNAMES
DO $$
DECLARE
    user_record RECORD;
BEGIN
    RAISE NOTICE '=== USUÁRIOS CADASTRADOS ===';
    FOR user_record IN 
        SELECT user_id, name, username, is_active 
        FROM public.user_profiles 
        ORDER BY name
    LOOP
        RAISE NOTICE 'ID: % | Nome: % | Username: % | Ativo: %', 
            user_record.user_id, 
            user_record.name, 
            user_record.username, 
            user_record.is_active;
    END LOOP;
END $$;

-- 2. VERIFICAR MODALIDADES
DO $$
DECLARE
    modality_record RECORD;
BEGIN
    RAISE NOTICE '=== MODALIDADES CADASTRADAS ===';
    FOR modality_record IN 
        SELECT m.id, m.name, m.valor, m.user_id, up.name as user_name
        FROM public.modalities m
        LEFT JOIN public.user_profiles up ON m.user_id = up.user_id
        ORDER BY up.name, m.name
    LOOP
        RAISE NOTICE 'ID: % | Nome: % | Valor: % | User ID: % | Usuário: %', 
            modality_record.id, 
            modality_record.name, 
            modality_record.valor, 
            modality_record.user_id, 
            modality_record.user_name;
    END LOOP;
END $$;

-- 3. VERIFICAR AGENDAMENTOS
DO $$
DECLARE
    appointment_record RECORD;
BEGIN
    RAISE NOTICE '=== AGENDAMENTOS CADASTRADOS ===';
    FOR appointment_record IN 
        SELECT 
            a.id, 
            a.date, 
            a.status, 
            a.modality, 
            a.user_id, 
            a.client_id,
            up.name as admin_name,
            bc.name as client_name
        FROM public.appointments a
        LEFT JOIN public.user_profiles up ON a.user_id = up.user_id
        LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
        ORDER BY a.date DESC
        LIMIT 10
    LOOP
        RAISE NOTICE 'ID: % | Data: % | Status: % | Modalidade: % | Admin: % | Cliente: %', 
            appointment_record.id, 
            appointment_record.date, 
            appointment_record.status, 
            appointment_record.modality, 
            appointment_record.admin_name, 
            appointment_record.client_name;
    END LOOP;
END $$;

-- 4. VERIFICAR CONFIGURAÇÕES
DO $$
DECLARE
    config_record RECORD;
BEGIN
    RAISE NOTICE '=== CONFIGURAÇÕES DE AGENDAMENTO ONLINE ===';
    FOR config_record IN 
        SELECT 
            s.user_id, 
            s.online_enabled, 
            up.name as user_name,
            up.username
        FROM public.settings s
        LEFT JOIN public.user_profiles up ON s.user_id = up.user_id
        ORDER BY up.name
    LOOP
        RAISE NOTICE 'User ID: % | Nome: % | Username: % | Online Enabled: %', 
            config_record.user_id, 
            config_record.user_name, 
            config_record.username, 
            config_record.online_enabled;
    END LOOP;
END $$;

-- 5. TESTE ESPECÍFICO PARA UM USUÁRIO
DO $$
DECLARE
    test_user_id UUID;
    test_username VARCHAR;
    modality_count INTEGER;
    appointment_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTE ESPECÍFICO ===';
    
    -- Pegar primeiro usuário com username
    SELECT user_id, username INTO test_user_id, test_username 
    FROM public.user_profiles 
    WHERE username IS NOT NULL 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testando usuário: % (ID: %)', test_username, test_user_id;
        
        -- Contar modalidades
        SELECT COUNT(*) INTO modality_count 
        FROM public.modalities 
        WHERE user_id = test_user_id;
        
        RAISE NOTICE 'Modalidades encontradas: %', modality_count;
        
        -- Contar agendamentos
        SELECT COUNT(*) INTO appointment_count 
        FROM public.appointments 
        WHERE user_id = test_user_id;
        
        RAISE NOTICE 'Agendamentos encontrados: %', appointment_count;
        
        -- Mostrar modalidades específicas
        RAISE NOTICE 'Modalidades do usuário:';
        FOR modality_record IN 
            SELECT name, valor 
            FROM public.modalities 
            WHERE user_id = test_user_id
        LOOP
            RAISE NOTICE '  - % (R$ %)', modality_record.name, modality_record.valor;
        END LOOP;
        
    ELSE
        RAISE NOTICE 'Nenhum usuário com username encontrado!';
    END IF;
END $$;
