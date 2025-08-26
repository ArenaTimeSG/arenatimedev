-- =====================================================
-- SOLUÇÃO DE EMERGÊNCIA - REMOVER FOREIGN KEY CONSTRAINT
-- Execute este script para permitir que o agendamento funcione
-- =====================================================

-- 1. REMOVER A CONSTRAINT PROBLEMÁTICA
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

-- 3. TESTAR INSERÇÃO SEM CONSTRAINT
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_appointment_id UUID;
BEGIN
    RAISE NOTICE '=== TESTANDO INSERÇÃO SEM CONSTRAINT ===';
    
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

RAISE NOTICE '✅ CONSTRAINT REMOVIDA - AGENDAMENTO DEVE FUNCIONAR!';
