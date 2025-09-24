-- =====================================================
-- CORREÇÃO DO ERRO "admin_user_id" NOT NULL
-- =====================================================

-- Este script corrige o erro "null value in column 'admin_user_id' of relation 'booking_clients' violates not-null constraint"

-- 1. Verificar estrutura atual da tabela booking_clients
SELECT 'Estrutura atual da tabela booking_clients:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se existe coluna admin_user_id
SELECT 'Verificando coluna admin_user_id:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_clients' 
AND column_name = 'admin_user_id' 
AND table_schema = 'public';

-- 3. Se a coluna admin_user_id existir e for NOT NULL, torná-la opcional
DO $$
BEGIN
    -- Verificar se a coluna admin_user_id existe e é NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_clients' 
        AND column_name = 'admin_user_id' 
        AND is_nullable = 'NO'
        AND table_schema = 'public'
    ) THEN
        -- Tornar a coluna nullable
        ALTER TABLE public.booking_clients 
        ALTER COLUMN admin_user_id DROP NOT NULL;
        
        RAISE NOTICE 'Coluna admin_user_id tornada opcional (nullable)';
    ELSE
        RAISE NOTICE 'Coluna admin_user_id não existe ou já é opcional';
    END IF;
END $$;

-- 4. Se a coluna admin_user_id não existir, criar como opcional
DO $$
BEGIN
    -- Verificar se a coluna admin_user_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_clients' 
        AND column_name = 'admin_user_id' 
        AND table_schema = 'public'
    ) THEN
        -- Criar coluna admin_user_id como opcional
        ALTER TABLE public.booking_clients 
        ADD COLUMN admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Coluna admin_user_id criada como opcional';
    ELSE
        RAISE NOTICE 'Coluna admin_user_id já existe';
    END IF;
END $$;

-- 5. Garantir que a coluna user_id existe (para compatibilidade)
ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Remover todas as políticas RLS existentes
DROP POLICY IF EXISTS "Clients can view their own data" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can insert booking clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can insert booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Clients can update their own data" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can view own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can insert own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can update own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can delete own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can view booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can update booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can delete booking_clients" ON public.booking_clients;

-- 7. Criar políticas RLS simples que permitem operações públicas
-- (Necessário para cadastro e login de clientes)

-- SELECT: Permitir visualização pública (necessário para login)
CREATE POLICY "Public can view booking_clients" ON public.booking_clients
    FOR SELECT USING (true);

-- INSERT: Permitir inserção pública (necessário para cadastro)
CREATE POLICY "Public can insert booking_clients" ON public.booking_clients
    FOR INSERT WITH CHECK (true);

-- UPDATE: Permitir atualização pública (necessário para atualizar dados)
CREATE POLICY "Public can update booking_clients" ON public.booking_clients
    FOR UPDATE USING (true);

-- DELETE: Permitir exclusão pública (necessário para deletar conta)
CREATE POLICY "Public can delete booking_clients" ON public.booking_clients
    FOR DELETE USING (true);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON public.booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_booking_clients_phone ON public.booking_clients(phone);
CREATE INDEX IF NOT EXISTS idx_booking_clients_user_id ON public.booking_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_clients_admin_user_id ON public.booking_clients(admin_user_id);

-- 9. Verificar estrutura final da tabela
SELECT 'Estrutura final da tabela booking_clients:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Verificar políticas RLS finais
SELECT 'Políticas RLS finais:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'booking_clients';

-- 11. Teste de inserção (comentado para não executar automaticamente)
/*
-- Teste para verificar se a inserção funciona
INSERT INTO public.booking_clients (name, email, password_hash, phone)
VALUES ('Teste Cliente', 'teste@email.com', 'hash_teste', '11999999999');

-- Verificar se o registro foi inserido
SELECT * FROM public.booking_clients WHERE email = 'teste@email.com';

-- Limpar teste
DELETE FROM public.booking_clients WHERE email = 'teste@email.com';
*/

-- 12. Informações sobre as mudanças
SELECT 'CORREÇÃO CONCLUÍDA' as status;
SELECT 'Problemas corrigidos:' as info;
SELECT '- Coluna admin_user_id tornada opcional (nullable)' as info;
SELECT '- Políticas RLS ajustadas para permitir operações públicas' as info;
SELECT '- Cadastro de clientes deve funcionar agora' as info;
SELECT '- Login de clientes deve funcionar agora' as info;
SELECT 'O sistema de cadastro e login de clientes deve funcionar agora.' as info;
