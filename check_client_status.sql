-- =====================================================
-- VERIFICAÇÃO DO STATUS DOS CLIENTES EXISTENTES
-- =====================================================

-- Este script verifica o status atual dos clientes e se o login deve funcionar

-- 1. VERIFICAR CLIENTES EXISTENTES
-- =====================================================

-- Listar todos os clientes na tabela booking_clients
SELECT 'Clientes existentes na tabela booking_clients:' as info;
SELECT 
    id,
    name,
    email,
    phone,
    is_active,
    created_at,
    updated_at
FROM public.booking_clients
ORDER BY created_at DESC;

-- Contar total de clientes
SELECT 'Total de clientes:' as info;
SELECT COUNT(*) as total_clients
FROM public.booking_clients;

-- 2. VERIFICAR SE HÁ EMAILS DUPLICADOS
-- =====================================================

-- Verificar se ainda há emails duplicados
SELECT 'Emails duplicados (se houver):' as info;
SELECT email, COUNT(*) as quantidade
FROM public.booking_clients 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Verificar políticas RLS da tabela booking_clients
SELECT 'Políticas RLS da tabela booking_clients:' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'booking_clients' AND schemaname = 'public'
ORDER BY policyname;

-- 4. TESTE DE LOGIN SIMULADO
-- =====================================================

-- Simular busca por email (como o sistema de login faz)
-- Substitua 'PEDROGREEF06@GMAIL.COM' pelo email do seu cliente
SELECT 'Teste de busca por email (simulando login):' as info;
SELECT 
    id,
    name,
    email,
    phone,
    password_hash,
    is_active
FROM public.booking_clients
WHERE email = 'PEDROGREEF06@GMAIL.COM';

-- 5. VERIFICAR APPOINTMENTS DO CLIENTE
-- =====================================================

-- Verificar se o cliente tem appointments
SELECT 'Appointments do cliente (se existirem):' as info;
SELECT 
    a.id as appointment_id,
    a.date,
    a.status,
    a.created_at
FROM public.appointments a
JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY a.date DESC;

-- 6. RECOMENDAÇÕES
-- =====================================================

-- Verificar se o cliente pode fazer login
SELECT 'Status do cliente para login:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'ERRO: Cliente não encontrado - precisa criar novo'
        WHEN COUNT(*) = 1 THEN 'OK: Cliente encontrado - login deve funcionar'
        WHEN COUNT(*) > 1 THEN 'ERRO: Múltiplos clientes com mesmo email - precisa limpar'
    END as status,
    COUNT(*) as quantidade
FROM public.booking_clients
WHERE email = 'PEDROGREEF06@GMAIL.COM';

-- 7. INFORMAÇÕES FINAIS
-- =====================================================

SELECT 'VERIFICAÇÃO CONCLUÍDA' as status;
SELECT 'Próximos passos:' as info;
SELECT '- Se cliente existe: teste o login' as info;
SELECT '- Se cliente não existe: crie um novo' as info;
SELECT '- Se há duplicatas: execute script de limpeza' as info;
SELECT 'Verifique os resultados acima para decidir a ação.' as info;
