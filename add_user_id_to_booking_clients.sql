-- Script para adicionar user_id à tabela booking_clients e isolar dados por usuário

-- 1. Adicionar a coluna user_id se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_clients' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.booking_clients 
        ADD COLUMN user_id UUID REFERENCES auth.users(id);
        
        -- Criar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_booking_clients_user_id 
        ON public.booking_clients(user_id);
    END IF;
END $$;

-- 2. Atualizar clientes existentes com o user_id do primeiro usuário admin
-- (assumindo que todos os clientes existentes pertencem ao primeiro usuário)
UPDATE public.booking_clients 
SET user_id = (
    SELECT id FROM auth.users 
    WHERE email LIKE '%admin%' OR email LIKE '%@%'
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE user_id IS NULL;

-- 3. Atualizar políticas RLS para booking_clients
DROP POLICY IF EXISTS "Users can view own clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.booking_clients;

-- Política para visualizar apenas clientes próprios
CREATE POLICY "Users can view own clients" ON public.booking_clients
    FOR SELECT USING (auth.uid() = user_id);

-- Política para inserir clientes próprios
CREATE POLICY "Users can insert own clients" ON public.booking_clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para atualizar clientes próprios
CREATE POLICY "Users can update own clients" ON public.booking_clients
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para deletar clientes próprios
CREATE POLICY "Users can delete own clients" ON public.booking_clients
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Habilitar RLS na tabela
ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;

-- Verificar resultado
SELECT 
    'booking_clients' as tabela,
    COUNT(*) as total_clientes,
    COUNT(DISTINCT user_id) as usuarios_distintos,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as sem_user_id
FROM public.booking_clients;
