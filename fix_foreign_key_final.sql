-- =====================================================
-- CORRIGIR FOREIGN KEY CONSTRAINT FINAL
-- Recriar a constraint correta entre appointments e booking_clients
-- =====================================================

-- 1. VERIFICAR SE A CONSTRAINT FOI REMOVIDA
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO CONSTRAINT ATUAL ===';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_client_id_fkey'
        AND table_name = 'appointments'
    ) THEN
        RAISE NOTICE '✅ Constraint foi removida - vamos recriar corretamente';
    ELSE
        RAISE NOTICE '⚠️ Constraint ainda existe - vamos removê-la primeiro';
        ALTER TABLE public.appointments DROP CONSTRAINT appointments_client_id_fkey;
    END IF;
END $$;

-- 2. CRIAR A CONSTRAINT CORRETA
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.booking_clients(id);

-- 3. VERIFICAR SE FOI CRIADA CORRETAMENTE
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICANDO NOVA CONSTRAINT ===';
    
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
        RAISE NOTICE '✅ Nova Constraint: % | Tabela: % | Coluna: % | FK Tabela: % | FK Coluna: %', 
            constraint_record.constraint_name,
            constraint_record.table_name,
            constraint_record.column_name,
            constraint_record.foreign_table_name,
            constraint_record.foreign_column_name;
    END LOOP;
END $$;

-- 4. TESTAR INSERÇÃO
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_appointment_id UUID;
BEGIN
    RAISE NOTICE '=== TESTANDO INSERÇÃO APÓS CORREÇÃO ===';
    
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

RAISE NOTICE '✅ FOREIGN KEY CONSTRAINT CORRIGIDA COM SUCESSO!';
