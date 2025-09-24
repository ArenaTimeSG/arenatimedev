-- =====================================================
-- CORREÇÃO DO RELACIONAMENTO APPOINTMENTS -> BOOKING_CLIENTS
-- =====================================================

-- =====================================================
-- 1. VERIFICAR ESTRUTURA ATUAL
-- =====================================================

-- Verificar constraints de chave estrangeira da tabela appointments
SELECT 'Constraints atuais da tabela appointments:' as info;
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
AND tc.table_schema = 'public';

-- =====================================================
-- 2. CORRIGIR RELACIONAMENTO CLIENT_ID
-- =====================================================

-- Remover constraint antiga se existir (que referencia clients)
DO $$
BEGIN
    -- Verificar se existe constraint que referencia clients
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'appointments' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'clients'
        AND tc.table_schema = 'public'
    ) THEN
        -- Remover constraint antiga
        ALTER TABLE public.appointments 
        DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;
        
        RAISE NOTICE 'Constraint antiga removida';
    END IF;
END $$;

-- Adicionar nova constraint que referencia booking_clients
DO $$
BEGIN
    -- Verificar se já existe constraint correta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'appointments' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'booking_clients'
        AND tc.table_schema = 'public'
    ) THEN
        -- Adicionar nova constraint
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.booking_clients(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Nova constraint adicionada';
    ELSE
        RAISE NOTICE 'Constraint correta já existe';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICAR E CORRIGIR OUTROS RELACIONAMENTOS
-- =====================================================

-- Verificar constraint modality_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'appointments' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'modalities'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_modality_id_fkey 
        FOREIGN KEY (modality_id) REFERENCES public.modalities(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Constraint modality_id adicionada';
    END IF;
END $$;

-- Verificar constraint recurrence_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'appointments' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'recurrences'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_recurrence_id_fkey 
        FOREIGN KEY (recurrence_id) REFERENCES public.recurrences(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Constraint recurrence_id adicionada';
    END IF;
END $$;

-- Verificar constraint user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'appointments' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Constraint user_id adicionada';
    ELSE
        RAISE NOTICE 'Constraint user_id já existe';
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar constraints finais
SELECT 'Constraints finais da tabela appointments:' as info;
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
AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- Verificar se o cliente específico existe na tabela correta
SELECT 'Verificando cliente específico:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.booking_clients WHERE id = 'b0afe42b-b5fd-4b43-91cd-0a672c80b3fb')
        THEN '✅ Cliente existe na tabela booking_clients'
        ELSE '❌ Cliente NÃO existe na tabela booking_clients'
    END as status;

-- Testar inserção de um agendamento de exemplo
SELECT 'Testando inserção de agendamento:' as info;
INSERT INTO public.appointments (
    client_id, 
    date, 
    modality_id, 
    status, 
    booking_source, 
    is_cortesia, 
    payment_status, 
    user_id
)
SELECT 
    (SELECT id FROM public.booking_clients LIMIT 1),
    NOW() + INTERVAL '1 day',
    (SELECT id FROM public.modalities LIMIT 1),
    'agendado',
    'manual',
    false,
    'not_required',
    auth.uid()
WHERE EXISTS (SELECT 1 FROM public.booking_clients LIMIT 1)
AND EXISTS (SELECT 1 FROM public.modalities LIMIT 1)
ON CONFLICT DO NOTHING;

SELECT '🎉 RELACIONAMENTOS CORRIGIDOS COM SUCESSO!' as status_final;
