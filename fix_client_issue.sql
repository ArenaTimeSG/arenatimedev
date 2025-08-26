-- =====================================================
-- CORRIGIR PROBLEMA DO CLIENT_ID
-- =====================================================

-- 1. REMOVER AGENDAMENTOS COM CLIENT_ID INVÁLIDO
DO $$
DECLARE
    invalid_appointment_record RECORD;
    deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== REMOVENDO AGENDAMENTOS COM CLIENT_ID INVÁLIDO ===';
    
    FOR invalid_appointment_record IN 
        SELECT a.id, a.client_id, a.date, a.status
        FROM public.appointments a
        LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
        WHERE a.client_id IS NOT NULL AND bc.id IS NULL
    LOOP
        DELETE FROM public.appointments WHERE id = invalid_appointment_record.id;
        deleted_count := deleted_count + 1;
        RAISE NOTICE 'Removido agendamento: ID=% | Client_ID=% | Data=% | Status=%', 
            invalid_appointment_record.id,
            invalid_appointment_record.client_id,
            invalid_appointment_record.date,
            invalid_appointment_record.status;
    END LOOP;
    
    IF deleted_count = 0 THEN
        RAISE NOTICE '✅ Nenhum agendamento inválido encontrado';
    ELSE
        RAISE NOTICE '✅ Removidos % agendamentos inválidos', deleted_count;
    END IF;
END $$;

-- 2. VERIFICAR SE A FOREIGN KEY CONSTRAINT ESTÁ CORRETA
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICANDO FOREIGN KEY CONSTRAINT ===';
    
    FOR constraint_record IN 
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'appointments'
        AND kcu.column_name = 'client_id'
    LOOP
        RAISE NOTICE 'Constraint: % | Tabela: % | Coluna: % | FK Tabela: % | FK Coluna: %', 
            constraint_record.constraint_name,
            constraint_record.table_name,
            constraint_record.column_name,
            constraint_record.foreign_table_name,
            constraint_record.foreign_column_name;
    END LOOP;
END $$;

-- 3. CRIAR CLIENTE DE TESTE SE NÃO EXISTIR
DO $$
DECLARE
    test_client_id UUID;
    client_count INTEGER;
BEGIN
    RAISE NOTICE '=== CRIANDO CLIENTE DE TESTE ===';
    
    -- Contar clientes existentes
    SELECT COUNT(*) INTO client_count FROM public.booking_clients;
    
    IF client_count = 0 THEN
        RAISE NOTICE 'Nenhum cliente encontrado. Criando cliente de teste...';
        
        INSERT INTO public.booking_clients (
            name, 
            email, 
            phone, 
            password_hash
        ) VALUES (
            'Cliente Teste',
            'teste@exemplo.com',
            '11999999999',
            'dGVzdGUxMjM=' -- "teste123" em base64
        ) RETURNING id INTO test_client_id;
        
        RAISE NOTICE '✅ Cliente de teste criado com ID: %', test_client_id;
    ELSE
        RAISE NOTICE 'Já existem % clientes. Não criando cliente de teste.', client_count;
    END IF;
END $$;

-- 4. TESTAR INSERÇÃO DE AGENDAMENTO
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_appointment_id UUID;
BEGIN
    RAISE NOTICE '=== TESTANDO INSERÇÃO DE AGENDAMENTO ===';
    
    -- Pegar um user_id de teste
    SELECT user_id INTO test_user_id 
    FROM public.user_profiles 
    LIMIT 1;
    
    -- Pegar um client_id de teste
    SELECT id INTO test_client_id 
    FROM public.booking_clients 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_client_id IS NOT NULL THEN
        RAISE NOTICE 'Testando inserção com user_id: % e client_id: %', test_user_id, test_client_id;
        
        -- Tentar inserir um agendamento de teste
        INSERT INTO public.appointments (
            user_id, 
            client_id, 
            date, 
            status, 
            modality, 
            valor_total
        ) VALUES (
            test_user_id,
            test_client_id,
            NOW() + INTERVAL '1 day',
            'a_cobrar',
            'Teste Modalidade',
            100.00
        ) RETURNING id INTO test_appointment_id;
        
        IF test_appointment_id IS NOT NULL THEN
            RAISE NOTICE '✅ Inserção bem-sucedida! ID: %', test_appointment_id;
            
            -- Limpar o teste
            DELETE FROM public.appointments WHERE id = test_appointment_id;
            RAISE NOTICE '✅ Agendamento de teste removido';
        ELSE
            RAISE NOTICE '❌ Falha na inserção';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Dados de teste não encontrados';
    END IF;
END $$;

RAISE NOTICE '✅ PROBLEMA DO CLIENT_ID CORRIGIDO!';
