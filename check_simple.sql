-- =====================================================
-- VERIFICAÇÃO SIMPLES DO STATUS DOS CLIENTES
-- =====================================================

-- Script simples para verificar se há clientes e se o login funciona

-- 1. VERIFICAR SE A TABELA EXISTE E TEM DADOS
-- =====================================================

-- Contar total de registros na tabela booking_clients
SELECT 'Total de clientes na tabela:' as info;
SELECT COUNT(*) as total FROM public.booking_clients;

-- 2. LISTAR TODOS OS CLIENTES (se houver)
-- =====================================================

-- Mostrar todos os clientes
SELECT 'Todos os clientes:' as info;
SELECT 
    id,
    name,
    email,
    phone,
    created_at
FROM public.booking_clients
ORDER BY created_at DESC;

-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 'RLS habilitado na tabela booking_clients:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'booking_clients' AND schemaname = 'public';

-- Verificar políticas RLS
SELECT 'Políticas RLS:' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'booking_clients' AND schemaname = 'public';

-- 4. TESTE DE INSERÇÃO SIMPLES
-- =====================================================

-- Tentar inserir um cliente de teste
INSERT INTO public.booking_clients (name, email, password_hash, phone)
VALUES ('Cliente Teste', 'teste@email.com', 'hash_teste', '11999999999')
RETURNING id, name, email;

-- 5. VERIFICAR SE A INSERÇÃO FUNCIONOU
-- =====================================================

-- Verificar se o cliente de teste foi inserido
SELECT 'Cliente de teste inserido:' as info;
SELECT 
    id,
    name,
    email,
    phone,
    created_at
FROM public.booking_clients
WHERE email = 'teste@email.com';

-- 6. LIMPAR TESTE
-- =====================================================

-- Remover cliente de teste
DELETE FROM public.booking_clients WHERE email = 'teste@email.com';

-- 7. RESULTADO FINAL
-- =====================================================

SELECT 'VERIFICAÇÃO CONCLUÍDA' as status;
SELECT 'Se não apareceu nada acima, a tabela está vazia' as info;
SELECT 'Você precisa criar um novo cliente' as info;
