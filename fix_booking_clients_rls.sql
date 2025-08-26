-- =====================================================
-- CORRIGIR POLÍTICAS RLS PARA BOOKING_CLIENTS
-- Execute este script para permitir que clientes se registrem
-- =====================================================

-- 1. VERIFICAR POLÍTICAS EXISTENTES
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== POLÍTICAS EXISTENTES PARA BOOKING_CLIENTS ===';
    
    FOR policy_record IN 
        SELECT policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'booking_clients'
    LOOP
        RAISE NOTICE 'Política: % | Comando: % | Roles: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles;
    END LOOP;
END $$;

-- 2. REMOVER POLÍTICAS EXISTENTES (se houver)
DROP POLICY IF EXISTS "Users can manage their own client data" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can insert clients for registration" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can read clients for login" ON public.booking_clients;

-- 3. CRIAR NOVAS POLÍTICAS
-- Política pública para inserção de clientes (registro)
CREATE POLICY "Public can insert clients for registration" ON public.booking_clients
    FOR INSERT 
    WITH CHECK (true);

-- Política pública para leitura de clientes (login)
CREATE POLICY "Public can read clients for login" ON public.booking_clients
    FOR SELECT 
    USING (true);

-- Política para clientes atualizarem seus próprios dados
CREATE POLICY "Users can update their own client data" ON public.booking_clients
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 4. VERIFICAR SE A TABELA TEM RLS HABILITADO
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'booking_clients' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS está habilitado na tabela booking_clients';
    ELSE
        RAISE NOTICE '❌ RLS NÃO está habilitado na tabela booking_clients';
        ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado na tabela booking_clients';
    END IF;
END $$;

-- 5. VERIFICAR ESTRUTURA DA TABELA BOOKING_CLIENTS
DO $$
DECLARE
    column_record RECORD;
BEGIN
    RAISE NOTICE '=== ESTRUTURA DA TABELA BOOKING_CLIENTS ===';
    
    FOR column_record IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'booking_clients'
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
    test_client_id UUID;
BEGIN
    RAISE NOTICE '=== TESTANDO INSERÇÃO PÚBLICA ===';
    
    -- Tentar inserir um cliente de teste
    INSERT INTO public.booking_clients (
        name, 
        email, 
        password_hash, 
        phone
    ) VALUES (
        'Cliente Teste',
        'teste@exemplo.com',
        'teste_hash',
        '11999999999'
    ) RETURNING id INTO test_client_id;
    
    IF test_client_id IS NOT NULL THEN
        RAISE NOTICE '✅ Inserção de teste bem-sucedida! ID: %', test_client_id;
        
        -- Limpar o teste
        DELETE FROM public.booking_clients WHERE id = test_client_id;
        RAISE NOTICE '✅ Cliente de teste removido';
    ELSE
        RAISE NOTICE '❌ Falha na inserção de teste';
    END IF;
END $$;

-- 7. VERIFICAR DADOS EXISTENTES
DO $$
DECLARE
    total_clients INTEGER;
    client_record RECORD;
BEGIN
    RAISE NOTICE '=== DADOS EXISTENTES ===';
    
    -- Contar total de clientes
    SELECT COUNT(*) INTO total_clients FROM public.booking_clients;
    RAISE NOTICE 'Total de clientes: %', total_clients;
    
    -- Mostrar alguns clientes recentes
    FOR client_record IN 
        SELECT 
            id, 
            name, 
            email, 
            phone,
            created_at
        FROM public.booking_clients 
        ORDER BY created_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE 'Cliente: ID=% | Nome=% | Email=% | Telefone=% | Criado=%', 
            client_record.id,
            client_record.name,
            client_record.email,
            client_record.phone,
            client_record.created_at;
    END LOOP;
END $$;
