-- =====================================================
-- DEBUG: VERIFICAR PROBLEMA DO CLIENT_ID
-- =====================================================

-- 1. VERIFICAR SE O CLIENT_ID EXISTE NA TABELA BOOKING_CLIENTS
DO $$
DECLARE
    client_id_to_check UUID := 'eb8b5bc4-31d0-4d15-97f2-edfc71ec87ff';
    client_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== VERIFICANDO CLIENT_ID ===';
    RAISE NOTICE 'Client ID a verificar: %', client_id_to_check;
    
    -- Verificar se o client_id existe
    SELECT EXISTS(
        SELECT 1 FROM public.booking_clients 
        WHERE id = client_id_to_check
    ) INTO client_exists;
    
    IF client_exists THEN
        RAISE NOTICE '✅ Client ID existe na tabela booking_clients';
    ELSE
        RAISE NOTICE '❌ Client ID NÃO existe na tabela booking_clients';
    END IF;
END $$;

-- 2. LISTAR TODOS OS CLIENTES EXISTENTES
DO $$
DECLARE
    client_record RECORD;
    client_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== LISTANDO TODOS OS CLIENTES ===';
    
    FOR client_record IN 
        SELECT id, name, email, phone, created_at 
        FROM public.booking_clients 
        ORDER BY created_at DESC
    LOOP
        client_count := client_count + 1;
        RAISE NOTICE 'Cliente %: ID=% | Nome=% | Email=% | Phone=% | Criado=%', 
            client_count,
            client_record.id,
            client_record.name,
            client_record.email,
            client_record.phone,
            client_record.created_at;
    END LOOP;
    
    IF client_count = 0 THEN
        RAISE NOTICE '⚠️ Nenhum cliente encontrado na tabela booking_clients';
    ELSE
        RAISE NOTICE 'Total de clientes: %', client_count;
    END IF;
END $$;

-- 3. VERIFICAR SE HÁ AGENDAMENTOS COM CLIENT_ID INVÁLIDO
DO $$
DECLARE
    invalid_appointment_record RECORD;
    invalid_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== VERIFICANDO AGENDAMENTOS COM CLIENT_ID INVÁLIDO ===';
    
    FOR invalid_appointment_record IN 
        SELECT a.id, a.client_id, a.date, a.status
        FROM public.appointments a
        LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
        WHERE a.client_id IS NOT NULL AND bc.id IS NULL
    LOOP
        invalid_count := invalid_count + 1;
        RAISE NOTICE 'Agendamento inválido %: ID=% | Client_ID=% | Data=% | Status=%', 
            invalid_count,
            invalid_appointment_record.id,
            invalid_appointment_record.client_id,
            invalid_appointment_record.date,
            invalid_appointment_record.status;
    END LOOP;
    
    IF invalid_count = 0 THEN
        RAISE NOTICE '✅ Nenhum agendamento com client_id inválido encontrado';
    ELSE
        RAISE NOTICE '⚠️ Encontrados % agendamentos com client_id inválido', invalid_count;
    END IF;
END $$;

-- 4. CRIAR UM CLIENTE DE TESTE SE NÃO EXISTIR NENHUM
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

RAISE NOTICE '✅ DEBUG CONCLUÍDO!';
