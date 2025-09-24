-- =====================================================
-- VERIFICAR E CORRIGIR RELACIONAMENTOS DA TABELA APPOINTMENTS
-- =====================================================

-- Verificar estrutura atual da tabela appointments
SELECT 'Estrutura atual da tabela appointments:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints de chave estrangeira
SELECT 'Constraints de chave estrangeira da tabela appointments:' as info;
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

-- Verificar se a tabela clients existe
SELECT 'Verificando se tabela clients existe:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') 
        THEN '✅ Tabela clients existe'
        ELSE '❌ Tabela clients NÃO existe'
    END as status;

-- Verificar se a tabela booking_clients existe
SELECT 'Verificando se tabela booking_clients existe:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_clients' AND table_schema = 'public') 
        THEN '✅ Tabela booking_clients existe'
        ELSE '❌ Tabela booking_clients NÃO existe'
    END as status;

-- Verificar dados nas tabelas
SELECT 'Dados na tabela clients:' as info;
SELECT COUNT(*) as total_clients FROM public.clients;

SELECT 'Dados na tabela booking_clients:' as info;
SELECT COUNT(*) as total_booking_clients FROM public.booking_clients;

-- Verificar se há client_id específico que está causando erro
SELECT 'Verificando client_id específico:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.clients WHERE id = 'b0afe42b-b5fd-4b43-91cd-0a672c80b3fb')
        THEN '✅ Cliente existe na tabela clients'
        ELSE '❌ Cliente NÃO existe na tabela clients'
    END as status_clients;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.booking_clients WHERE id = 'b0afe42b-b5fd-4b43-91cd-0a672c80b3fb')
        THEN '✅ Cliente existe na tabela booking_clients'
        ELSE '❌ Cliente NÃO existe na tabela booking_clients'
    END as status_booking_clients;
