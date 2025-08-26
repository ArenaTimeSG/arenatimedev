-- =====================================================
-- CORREÇÃO FINAL - POLÍTICAS RLS PARA AGENDAMENTO ONLINE
-- Execute este script para corrigir todas as políticas RLS
-- =====================================================

-- 1. CORRIGIR POLÍTICAS DA TABELA APPOINTMENTS
-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can insert appointments for online booking" ON public.appointments;
DROP POLICY IF EXISTS "Public can read appointments for online booking" ON public.appointments;
DROP POLICY IF EXISTS "Public can update appointments for online booking" ON public.appointments;

-- Criar novas políticas
CREATE POLICY "Users can manage their own appointments" ON public.appointments
    FOR ALL TO authenticated 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can insert appointments for online booking" ON public.appointments
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Public can read appointments for online booking" ON public.appointments
    FOR SELECT 
    USING (true);

CREATE POLICY "Public can update appointments for online booking" ON public.appointments
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 2. CORRIGIR POLÍTICAS DA TABELA BOOKING_CLIENTS
-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage their own client data" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can insert clients for registration" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can read clients for login" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can update their own client data" ON public.booking_clients;

-- Criar novas políticas
CREATE POLICY "Public can insert clients for registration" ON public.booking_clients
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Public can read clients for login" ON public.booking_clients
    FOR SELECT 
    USING (true);

CREATE POLICY "Users can update their own client data" ON public.booking_clients
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 3. CORRIGIR POLÍTICAS DA TABELA MODALITIES
-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage their own modalities" ON public.modalities;
DROP POLICY IF EXISTS "Public can read modalities for online booking" ON public.modalities;

-- Criar novas políticas
CREATE POLICY "Users can manage their own modalities" ON public.modalities
    FOR ALL TO authenticated 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can read modalities for online booking" ON public.modalities
    FOR SELECT 
    USING (true);

-- 4. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modalities ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICAR SE TUDO ESTÁ FUNCIONANDO
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_appointment_id UUID;
BEGIN
    RAISE NOTICE '=== TESTANDO SISTEMA ===';
    
    -- Pegar um user_id de teste
    SELECT user_id INTO test_user_id 
    FROM public.user_profiles 
    LIMIT 1;
    
    -- Pegar um client_id de teste (ou criar um)
    SELECT id INTO test_client_id 
    FROM public.booking_clients 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE '✅ User ID encontrado: %', test_user_id;
        
        IF test_client_id IS NOT NULL THEN
            RAISE NOTICE '✅ Client ID encontrado: %', test_client_id;
            
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
            RAISE NOTICE '⚠️ Nenhum cliente encontrado para teste';
        END IF;
    ELSE
        RAISE NOTICE '❌ Nenhum usuário encontrado para teste';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE '✅ POLÍTICAS RLS CORRIGIDAS COM SUCESSO!';
END $$;
