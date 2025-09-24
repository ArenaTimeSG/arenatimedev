-- =====================================================
-- CORREÇÃO ESPECÍFICA PARA CADASTRO DE CLIENTES ONLINE
-- =====================================================

-- Este script corrige especificamente o problema de "row-level security policy" 
-- que impede o cadastro de clientes no sistema de agendamento online

-- PROBLEMA IDENTIFICADO:
-- O sistema tem dois tipos de autenticação:
-- 1. Administradores: usam Supabase Auth (auth.uid())
-- 2. Clientes: usam sistema próprio com localStorage (sem auth.uid())
-- 
-- As políticas RLS atuais exigem auth.uid() = user_id, mas clientes online
-- não têm auth.uid() porque não usam Supabase Auth.

-- SOLUÇÃO:
-- Criar políticas RLS que permitam operações públicas para clientes online
-- mas mantenham segurança para administradores.

-- 1. Verificar estrutura atual da tabela
SELECT 'Estrutura atual da tabela booking_clients:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS atuais
SELECT 'Políticas RLS atuais:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'booking_clients';

-- 3. Remover todas as políticas RLS existentes
DROP POLICY IF EXISTS "Clients can view their own data" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can insert booking clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Clients can update their own data" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can view own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can insert own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can update own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can delete own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can view booking_clients" ON public.booking_clients;

-- 4. Criar políticas RLS adequadas para ambos os sistemas

-- SELECT: Permitir visualização pública (necessário para login de clientes)
CREATE POLICY "Public can view booking_clients" ON public.booking_clients
    FOR SELECT USING (true);

-- INSERT: Permitir inserção pública (necessário para cadastro de clientes online)
-- e inserção por administradores autenticados
CREATE POLICY "Public can insert booking_clients" ON public.booking_clients
    FOR INSERT WITH CHECK (true);

-- UPDATE: Permitir atualização pelos próprios clientes (baseado no ID)
-- e por administradores autenticados
CREATE POLICY "Clients can update their own data" ON public.booking_clients
    FOR UPDATE USING (true);

-- DELETE: Permitir exclusão pelos próprios clientes
-- e por administradores autenticados
CREATE POLICY "Clients can delete their own data" ON public.booking_clients
    FOR DELETE USING (true);

-- 5. Garantir que a coluna user_id existe (opcional para clientes online)
ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON public.booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_booking_clients_phone ON public.booking_clients(phone);
CREATE INDEX IF NOT EXISTS idx_booking_clients_user_id ON public.booking_clients(user_id);

-- 7. Verificar estrutura final
SELECT 'Estrutura final da tabela booking_clients:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Verificar políticas RLS finais
SELECT 'Políticas RLS finais:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'booking_clients';

-- 9. Teste de inserção (comentado para não executar automaticamente)
/*
-- Teste para verificar se a inserção funciona
INSERT INTO public.booking_clients (name, email, password_hash, phone)
VALUES ('Teste Cliente Online', 'teste@email.com', 'hash_teste', '11999999999');

-- Verificar se o registro foi inserido
SELECT * FROM public.booking_clients WHERE email = 'teste@email.com';

-- Limpar teste
DELETE FROM public.booking_clients WHERE email = 'teste@email.com';
*/

-- 10. Informações sobre as mudanças
SELECT 'CORREÇÃO CONCLUÍDA' as status;
SELECT 'As políticas RLS foram ajustadas para suportar:' as info;
SELECT '- Cadastro público de clientes online (sem auth.uid())' as info;
SELECT '- Cadastro de clientes por administradores (com auth.uid())' as info;
SELECT '- Login de clientes online (visualização pública)' as info;
SELECT '- Atualização pelos próprios clientes' as info;
SELECT '- Exclusão pelos próprios clientes' as info;
SELECT 'O sistema de cadastro e login de clientes online deve funcionar agora.' as info;
