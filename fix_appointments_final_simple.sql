-- =====================================================
-- CORREÇÃO DEFINITIVA DO RELACIONAMENTO APPOINTMENTS
-- =====================================================

-- =====================================================
-- 1. VERIFICAR PROBLEMA ATUAL
-- =====================================================

-- Verificar constraints atuais
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
AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- =====================================================
-- 2. CORRIGIR APENAS O PROBLEMA PRINCIPAL
-- =====================================================

-- Remover constraint que referencia clients (se existir)
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;

-- Adicionar constraint correta que referencia booking_clients
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.booking_clients(id) ON DELETE CASCADE;

-- =====================================================
-- 3. VERIFICAÇÃO FINAL
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

SELECT '🎉 RELACIONAMENTO PRINCIPAL CORRIGIDO!' as status_final;
SELECT '✅ appointments.client_id agora referencia booking_clients' as correcao_1;
SELECT '✅ Sistema de agendamentos deve funcionar agora' as correcao_2;
