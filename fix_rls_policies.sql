-- =====================================================
-- CORRIGIR POLÍTICAS RLS PARA MODALITIES
-- Execute este script para corrigir as políticas RLS
-- =====================================================

-- 1. VERIFICAR POLÍTICAS EXISTENTES
DO $$
BEGIN
    RAISE NOTICE '=== POLÍTICAS EXISTENTES PARA MODALITIES ===';
    
    FOR policy_record IN 
        SELECT policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'modalities'
    LOOP
        RAISE NOTICE 'Política: % | Comando: % | Roles: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles;
    END LOOP;
END $$;

-- 2. REMOVER POLÍTICAS EXISTENTES (se houver)
DROP POLICY IF EXISTS "Users can manage their own modalities" ON public.modalities;
DROP POLICY IF EXISTS "Public can read modalities for online booking" ON public.modalities;

-- 3. CRIAR NOVAS POLÍTICAS
-- Política para usuários autenticados gerenciarem suas modalidades
CREATE POLICY "Users can manage their own modalities" ON public.modalities
    FOR ALL TO authenticated 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- Política pública para leitura de modalidades (agendamento online)
CREATE POLICY "Public can read modalities for online booking" ON public.modalities
    FOR SELECT 
    USING (true);

-- 4. VERIFICAR SE A TABELA TEM RLS HABILITADO
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'modalities' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS está habilitado na tabela modalities';
    ELSE
        RAISE NOTICE '❌ RLS NÃO está habilitado na tabela modalities';
        ALTER TABLE public.modalities ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado na tabela modalities';
    END IF;
END $$;

-- 5. TESTAR ACESSO PÚBLICO
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTANDO ACESSO PÚBLICO ===';
    
    -- Contar modalidades (acesso público)
    SELECT COUNT(*) INTO test_count FROM public.modalities;
    RAISE NOTICE 'Modalidades encontradas (acesso público): %', test_count;
    
    -- Mostrar algumas modalidades
    FOR modality_record IN 
        SELECT name, valor, user_id 
        FROM public.modalities 
        LIMIT 3
    LOOP
        RAISE NOTICE 'Modalidade: % | Valor: % | User ID: %', 
            modality_record.name, 
            modality_record.valor, 
            modality_record.user_id;
    END LOOP;
END $$;

-- 6. VERIFICAR DADOS EXISTENTES
DO $$
DECLARE
    total_modalities INTEGER;
    user_with_modalities INTEGER;
BEGIN
    RAISE NOTICE '=== DADOS EXISTENTES ===';
    
    -- Contar total de modalidades
    SELECT COUNT(*) INTO total_modalities FROM public.modalities;
    RAISE NOTICE 'Total de modalidades: %', total_modalities;
    
    -- Contar usuários com modalidades
    SELECT COUNT(DISTINCT user_id) INTO user_with_modalities FROM public.modalities;
    RAISE NOTICE 'Usuários com modalidades: %', user_with_modalities;
    
    -- Mostrar modalidades por usuário
    FOR user_record IN 
        SELECT 
            up.name as user_name,
            up.user_id,
            COUNT(m.id) as modality_count
        FROM public.user_profiles up
        LEFT JOIN public.modalities m ON up.user_id = m.user_id
        GROUP BY up.user_id, up.name
        HAVING COUNT(m.id) > 0
        ORDER BY up.name
    LOOP
        RAISE NOTICE 'Usuário: % | Modalidades: %', 
            user_record.user_name, 
            user_record.modality_count;
    END LOOP;
END $$;
