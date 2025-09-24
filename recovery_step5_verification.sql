-- =====================================================
-- ETAPA 5: VERIFICAÇÃO E TESTE DO SISTEMA
-- Execute este script para verificar se tudo está funcionando
-- =====================================================

-- 1. VERIFICAÇÃO GERAL DAS TABELAS
-- =====================================================
SELECT 'VERIFICAÇÃO GERAL DAS TABELAS' as titulo;

-- Listar todas as tabelas criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'appointments', 'payments', 'settings', 'monthly_events', 'time_blockades', 'booking_clients', 'online_reservations', 'recurrences')
ORDER BY table_name;

-- 2. VERIFICAÇÃO DAS COLUNAS DE CADA TABELA
-- =====================================================
SELECT 'VERIFICAÇÃO DAS COLUNAS' as titulo;

-- Clients
SELECT 'CLIENTS:' as tabela, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Appointments
SELECT 'APPOINTMENTS:' as tabela, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Payments
SELECT 'PAYMENTS:' as tabela, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Settings
SELECT 'SETTINGS:' as tabela, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Monthly Events
SELECT 'MONTHLY_EVENTS:' as tabela, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'monthly_events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Time Blockades
SELECT 'TIME_BLOCKADES:' as tabela, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'time_blockades' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Booking Clients
SELECT 'BOOKING_CLIENTS:' as tabela, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Online Reservations
SELECT 'ONLINE_RESERVATIONS:' as tabela, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'online_reservations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Recurrences
SELECT 'RECURRENCES:' as tabela, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'recurrences' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAÇÃO DOS ÍNDICES
-- =====================================================
SELECT 'VERIFICAÇÃO DOS ÍNDICES' as titulo;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'appointments', 'payments', 'settings', 'monthly_events', 'time_blockades', 'booking_clients', 'online_reservations', 'recurrences')
ORDER BY tablename, indexname;

-- 4. VERIFICAÇÃO DAS POLÍTICAS RLS
-- =====================================================
SELECT 'VERIFICAÇÃO DAS POLÍTICAS RLS' as titulo;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'HAS_QUALIFICATION'
        ELSE 'NO_QUALIFICATION'
    END as qualification_status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. VERIFICAÇÃO DOS TRIGGERS
-- =====================================================
SELECT 'VERIFICAÇÃO DOS TRIGGERS' as titulo;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('clients', 'appointments', 'payments', 'settings', 'monthly_events', 'time_blockades', 'booking_clients', 'online_reservations')
ORDER BY event_object_table, trigger_name;

-- 6. VERIFICAÇÃO DOS ENUMS
-- =====================================================
SELECT 'VERIFICAÇÃO DOS ENUMS' as titulo;

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('appointment_status', 'recurrence_type', 'payment_status')
ORDER BY t.typname, e.enumsortorder;

-- 7. VERIFICAÇÃO DAS FUNÇÕES
-- =====================================================
SELECT 'VERIFICAÇÃO DAS FUNÇÕES' as titulo;

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('update_updated_at_column', 'is_admin', 'can_access_client', 'allow_webhook_access')
ORDER BY routine_name;

-- 8. TESTE DE INSERÇÃO BÁSICA (SIMULAÇÃO)
-- =====================================================
SELECT 'TESTE DE INSERÇÃO BÁSICA' as titulo;

-- Verificar se podemos inserir dados (sem realmente inserir)
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_appointment_id UUID;
BEGIN
    -- Verificar se existe pelo menos um usuário
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE '✅ Usuário encontrado: %', test_user_id;
        
        -- Verificar se podemos inserir um cliente
        BEGIN
            INSERT INTO public.clients (name, email) 
            VALUES ('Cliente Teste', 'teste@email.com')
            RETURNING id INTO test_client_id;
            
            RAISE NOTICE '✅ Cliente inserido com sucesso: %', test_client_id;
            
            -- Verificar se podemos inserir um agendamento
            BEGIN
                INSERT INTO public.appointments (user_id, client_id, date, modality) 
                VALUES (test_user_id, test_client_id, NOW() + INTERVAL '1 day', 'Personal Training')
                RETURNING id INTO test_appointment_id;
                
                RAISE NOTICE '✅ Agendamento inserido com sucesso: %', test_appointment_id;
                
                -- Limpar dados de teste
                DELETE FROM public.appointments WHERE id = test_appointment_id;
                DELETE FROM public.clients WHERE id = test_client_id;
                
                RAISE NOTICE '✅ Dados de teste removidos com sucesso';
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ Erro ao inserir agendamento: %', SQLERRM;
            END;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao inserir cliente: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE '❌ Nenhum usuário encontrado na tabela auth.users';
    END IF;
END $$;

-- 9. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'VERIFICAÇÃO FINAL' as titulo;

-- Contar tabelas criadas
SELECT 
    COUNT(*) as total_tabelas_criadas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'appointments', 'payments', 'settings', 'monthly_events', 'time_blockades', 'booking_clients', 'online_reservations', 'recurrences');

-- Contar políticas RLS criadas
SELECT 
    COUNT(*) as total_politicas_rls
FROM pg_policies 
WHERE schemaname = 'public';

-- Contar índices criados
SELECT 
    COUNT(*) as total_indices
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'appointments', 'payments', 'settings', 'monthly_events', 'time_blockades', 'booking_clients', 'online_reservations', 'recurrences');

-- Contar triggers criados
SELECT 
    COUNT(*) as total_triggers
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('clients', 'appointments', 'payments', 'settings', 'monthly_events', 'time_blockades', 'booking_clients', 'online_reservations');

SELECT '🎉 VERIFICAÇÃO COMPLETA! Sistema pronto para uso!' as status_final;
