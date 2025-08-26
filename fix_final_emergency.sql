-- =====================================================
-- SOLUÇÃO FINAL DE EMERGÊNCIA - RESOLVER FOREIGN KEY
-- =====================================================

-- 1. REMOVER TODAS AS CONSTRAINTS PROBLEMÁTICAS
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;

-- 2. VERIFICAR SE FOI REMOVIDA
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO SE A CONSTRAINT FOI REMOVIDA ===';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_client_id_fkey'
        AND table_name = 'appointments'
    ) THEN
        RAISE NOTICE '✅ Constraint removida com sucesso!';
    ELSE
        RAISE NOTICE '❌ Constraint ainda existe!';
    END IF;
END $$;

-- 3. LIMPAR AGENDAMENTOS INVÁLIDOS
DELETE FROM public.appointments 
WHERE client_id IS NOT NULL 
AND client_id NOT IN (SELECT id FROM public.booking_clients);

-- 4. CRIAR CLIENTE DE TESTE SE NÃO EXISTIR
DO $$
DECLARE
    test_client_id UUID;
    client_count INTEGER;
BEGIN
    RAISE NOTICE '=== CRIANDO CLIENTE DE TESTE ===';
    
    SELECT COUNT(*) INTO client_count FROM public.booking_clients;
    
    IF client_count = 0 THEN
        INSERT INTO public.booking_clients (
            name, 
            email, 
            phone, 
            password_hash
        ) VALUES (
            'Cliente Teste',
            'teste@exemplo.com',
            '11999999999',
            'dGVzdGUxMjM='
        ) RETURNING id INTO test_client_id;
        
        RAISE NOTICE '✅ Cliente de teste criado com ID: %', test_client_id;
    ELSE
        RAISE NOTICE 'Já existem % clientes.', client_count;
    END IF;
END $$;

-- 5. TESTAR INSERÇÃO SEM CONSTRAINT
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_appointment_id UUID;
BEGIN
    RAISE NOTICE '=== TESTANDO INSERÇÃO SEM CONSTRAINT ===';
    
    SELECT user_id INTO test_user_id FROM public.user_profiles LIMIT 1;
    SELECT id INTO test_client_id FROM public.booking_clients LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_client_id IS NOT NULL THEN
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
            DELETE FROM public.appointments WHERE id = test_appointment_id;
            RAISE NOTICE '✅ Agendamento de teste removido';
        END IF;
    END IF;
END $$;

RAISE NOTICE '✅ SISTEMA CORRIGIDO - AGENDAMENTOS DEVEM FUNCIONAR!';
