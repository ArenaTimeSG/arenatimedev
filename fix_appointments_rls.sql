-- =====================================================
-- CORRIGIR POLÍTICAS RLS PARA APPOINTMENTS
-- Execute este script para permitir que clientes criem agendamentos
-- =====================================================

-- 1. VERIFICAR POLÍTICAS EXISTENTES
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== POLÍTICAS EXISTENTES PARA APPOINTMENTS ===';
    
    FOR policy_record IN 
        SELECT policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'appointments'
    LOOP
        RAISE NOTICE 'Política: % | Comando: % | Roles: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles;
    END LOOP;
END $$;

-- 2. REMOVER POLÍTICAS EXISTENTES (se houver)
DROP POLICY IF EXISTS "Users can manage their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can insert appointments for online booking" ON public.appointments;
DROP POLICY IF EXISTS "Public can read appointments for online booking" ON public.appointments;

-- 3. CRIAR NOVAS POLÍTICAS
-- Política para usuários autenticados gerenciarem seus agendamentos
CREATE POLICY "Users can manage their own appointments" ON public.appointments
    FOR ALL TO authenticated 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- Política pública para inserção de agendamentos (agendamento online)
CREATE POLICY "Public can insert appointments for online booking" ON public.appointments
    FOR INSERT 
    WITH CHECK (true);

-- Política pública para leitura de agendamentos (agendamento online)
CREATE POLICY "Public can read appointments for online booking" ON public.appointments
    FOR SELECT 
    USING (true);

-- Política pública para atualização de agendamentos (para clientes)
CREATE POLICY "Public can update appointments for online booking" ON public.appointments
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 4. VERIFICAR SE A TABELA TEM RLS HABILITADO
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'appointments' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS está habilitado na tabela appointments';
    ELSE
        RAISE NOTICE '❌ RLS NÃO está habilitado na tabela appointments';
        ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado na tabela appointments';
    END IF;
END $$;

-- 5. VERIFICAR ESTRUTURA DA TABELA APPOINTMENTS
DO $$
DECLARE
    column_record RECORD;
BEGIN
    RAISE NOTICE '=== ESTRUTURA DA TABELA APPOINTMENTS ===';
    
    FOR column_record IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Coluna: % | Tipo: % | Nullable: %', 
            column_record.column_name, 
            column_record.data_type, 
            column_record.is_nullable;
    END LOOP;
END $$;

-- 6. TESTAR INSERÇÃO PÚBLICA
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_appointment_id UUID;
BEGIN
    RAISE NOTICE '=== TESTANDO INSERÇÃO PÚBLICA ===';
    
    -- Pegar um user_id de teste
    SELECT user_id INTO test_user_id 
    FROM public.user_profiles 
    LIMIT 1;
    
    -- Pegar um client_id de teste (ou criar um)
    SELECT id INTO test_client_id 
    FROM public.booking_clients 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testando inserção com user_id: %', test_user_id;
        
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
            RAISE NOTICE '✅ Inserção de teste bem-sucedida! ID: %', test_appointment_id;
            
            -- Limpar o teste
            DELETE FROM public.appointments WHERE id = test_appointment_id;
            RAISE NOTICE '✅ Agendamento de teste removido';
        ELSE
            RAISE NOTICE '❌ Falha na inserção de teste';
        END IF;
    ELSE
        RAISE NOTICE '❌ Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 7. VERIFICAR DADOS EXISTENTES
DO $$
DECLARE
    total_appointments INTEGER;
    appointments_with_clients INTEGER;
    appointment_record RECORD;
BEGIN
    RAISE NOTICE '=== DADOS EXISTENTES ===';
    
    -- Contar total de agendamentos
    SELECT COUNT(*) INTO total_appointments FROM public.appointments;
    RAISE NOTICE 'Total de agendamentos: %', total_appointments;
    
    -- Contar agendamentos com client_id
    SELECT COUNT(*) INTO appointments_with_clients 
    FROM public.appointments 
    WHERE client_id IS NOT NULL;
    RAISE NOTICE 'Agendamentos com client_id: %', appointments_with_clients;
    
    -- Mostrar alguns agendamentos recentes
    FOR appointment_record IN 
        SELECT 
            id, 
            user_id, 
            client_id, 
            date, 
            status, 
            modality,
            valor_total
        FROM public.appointments 
        ORDER BY created_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE 'Agendamento: ID=% | User=% | Client=% | Data=% | Status=% | Modalidade=% | Valor=%', 
            appointment_record.id,
            appointment_record.user_id,
            appointment_record.client_id,
            appointment_record.date,
            appointment_record.status,
            appointment_record.modality,
            appointment_record.valor_total;
    END LOOP;
END $$;
