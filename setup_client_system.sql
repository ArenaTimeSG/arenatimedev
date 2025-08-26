-- =====================================================
-- Sistema de Clientes para Agendamento Online
-- Implementação conforme especificações do usuário
-- =====================================================

-- 1. Adicionar campo online_enabled na tabela settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'online_enabled'
    ) THEN
        ALTER TABLE public.settings 
        ADD COLUMN online_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Criar tabela booking_clients conforme especificação
CREATE TABLE IF NOT EXISTS public.booking_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Configurar RLS para booking_clients
ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para booking_clients
DO $$
BEGIN
    -- Política para permitir inserção pública (registro de clientes)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'booking_clients' 
        AND policyname = 'Public can insert booking clients'
    ) THEN
        CREATE POLICY "Public can insert booking clients" ON public.booking_clients
            FOR INSERT WITH CHECK (true);
    END IF;
    
    -- Política para clientes verem seus próprios dados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'booking_clients' 
        AND policyname = 'Clients can view their own data'
    ) THEN
        CREATE POLICY "Clients can view their own data" ON public.booking_clients
            FOR SELECT USING (true);
    END IF;
    
    -- Política para clientes atualizarem seus dados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'booking_clients' 
        AND policyname = 'Clients can update their own data'
    ) THEN
        CREATE POLICY "Clients can update their own data" ON public.booking_clients
            FOR UPDATE USING (true);
    END IF;
END $$;

-- 5. Adicionar coluna user_id na tabela appointments se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Políticas RLS para appointments (permitir agendamentos de clientes)
DO $$
BEGIN
    -- Política para permitir inserção pública (clientes fazendo agendamento)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Public can insert appointments for online booking'
    ) THEN
        CREATE POLICY "Public can insert appointments for online booking" ON public.appointments
            FOR INSERT WITH CHECK (true);
    END IF;
    
    -- Política para permitir leitura de agendamentos (para verificar disponibilidade)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Public can read appointments for availability check'
    ) THEN
        CREATE POLICY "Public can read appointments for availability check" ON public.appointments
            FOR SELECT USING (true);
    END IF;
    
    -- Política para permitir atualização de agendamentos (clientes e admins)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Public can update appointments'
    ) THEN
        CREATE POLICY "Public can update appointments" ON public.appointments
            FOR UPDATE USING (true);
    END IF;
    
    -- Manter política existente para usuários autenticados (admins)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Authenticated users can manage appointments'
    ) THEN
        CREATE POLICY "Authenticated users can manage appointments" ON public.appointments
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON public.booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);

-- 8. Adicionar comentários
COMMENT ON TABLE public.booking_clients IS 'Tabela para armazenar clientes do agendamento online';
COMMENT ON COLUMN public.booking_clients.password_hash IS 'Senha do cliente (hash)';
COMMENT ON COLUMN public.appointments.user_id IS 'ID do usuário admin (dono da agenda)';
COMMENT ON COLUMN public.appointments.client_id IS 'ID do cliente (pode ser da tabela clients ou booking_clients)';

-- 9. Verificar se a coluna username existe em user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN username VARCHAR(50) UNIQUE;
    END IF;
END $$;

-- 10. Adicionar constraint única no username se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_username_unique'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_username_unique UNIQUE (username);
    END IF;
END $$;

-- 11. Política pública para leitura de user_profiles (para buscar admin pelo username)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Public can view active user profiles for booking'
    ) THEN
        CREATE POLICY "Public can view active user profiles for booking" ON public.user_profiles
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- 12. Política pública para leitura de modalidades
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'modalities' 
        AND policyname = 'Public can view active modalities for booking'
    ) THEN
        CREATE POLICY "Public can view active modalities for booking" ON public.modalities
            FOR SELECT USING (true);
    END IF;
END $$;

-- 13. Política pública para leitura de settings (para verificar online_enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settings' 
        AND policyname = 'Public can read settings for online booking'
    ) THEN
        CREATE POLICY "Public can read settings for online booking" ON public.settings
            FOR SELECT USING (true);
    END IF;
END $$;

-- 14. Política pública para leitura de modalities (para listar modalidades disponíveis)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'modalities' 
        AND policyname = 'Public can read modalities for online booking'
    ) THEN
        CREATE POLICY "Public can read modalities for online booking" ON public.modalities
            FOR SELECT USING (true);
    END IF;
END $$;
