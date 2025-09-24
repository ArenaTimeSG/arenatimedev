-- =====================================================
-- CORREÇÃO DA TABELA BOOKING_CLIENTS
-- =====================================================

-- Verificar estrutura atual da tabela booking_clients
SELECT 'Estrutura atual da tabela booking_clients:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Adicionar coluna password_hash se não existir
ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT 'temp_hash';

-- Adicionar coluna user_id se não existir (para relacionar com o admin)
ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar coluna is_active se não existir
ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_booking_clients_user_id ON public.booking_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON public.booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_booking_clients_phone ON public.booking_clients(phone);

-- =====================================================
-- POLÍTICAS RLS PARA BOOKING_CLIENTS
-- =====================================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can insert own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can update own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can delete own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can view booking_clients" ON public.booking_clients;

-- Política para SELECT: usuários podem ver apenas seus próprios clientes
CREATE POLICY "Users can view own booking_clients" ON public.booking_clients
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar clientes para si mesmos
CREATE POLICY "Users can insert own booking_clients" ON public.booking_clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar apenas seus próprios clientes
CREATE POLICY "Users can update own booking_clients" ON public.booking_clients
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar apenas seus próprios clientes
CREATE POLICY "Users can delete own booking_clients" ON public.booking_clients
    FOR DELETE USING (auth.uid() = user_id);

-- Política pública para visualização (necessária para agendamento online)
CREATE POLICY "Public can view booking_clients" ON public.booking_clients
    FOR SELECT USING (true);

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

-- Trigger para booking_clients
DROP TRIGGER IF EXISTS update_booking_clients_updated_at ON public.booking_clients;
CREATE TRIGGER update_booking_clients_updated_at
    BEFORE UPDATE ON public.booking_clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura final da tabela
SELECT 'Estrutura final da tabela booking_clients:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 'Políticas RLS da tabela booking_clients:' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'booking_clients' AND schemaname = 'public'
ORDER BY policyname;

-- Testar inserção de um cliente de exemplo
INSERT INTO public.booking_clients (name, email, phone, user_id, password_hash)
VALUES ('Cliente Teste', 'teste@exemplo.com', '+55 11 99999-9999', auth.uid(), 'temp_hash')
ON CONFLICT DO NOTHING;

SELECT '🎉 TABELA BOOKING_CLIENTS CORRIGIDA COM SUCESSO!' as status_final;
