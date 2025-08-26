-- =====================================================
-- SISTEMA COMPLETO DE AGENDAMENTO ONLINE
-- Script definitivo para configurar todo o sistema
-- =====================================================

-- 1. CRIAR TABELA MODALITIES (se não existir)
CREATE TABLE IF NOT EXISTS public.modalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA BOOKING_CLIENTS (se não existir)
CREATE TABLE IF NOT EXISTS public.booking_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADICIONAR CAMPO ONLINE_ENABLED NA TABELA SETTINGS
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

-- 4. ADICIONAR CAMPO USER_ID NA TABELA APPOINTMENTS (se não existir)
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

-- 5. ADICIONAR CAMPO USERNAME NA TABELA USER_PROFILES (se não existir)
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

-- 6. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS PARA MODALITIES
DO $$
BEGIN
    -- Política para usuários autenticados gerenciarem suas modalidades
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'modalities' 
        AND policyname = 'Users can manage their own modalities'
    ) THEN
        CREATE POLICY "Users can manage their own modalities" ON public.modalities
            FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;
    
    -- Política pública para leitura de modalidades (agendamento online)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'modalities' 
        AND policyname = 'Public can read modalities for online booking'
    ) THEN
        CREATE POLICY "Public can read modalities for online booking" ON public.modalities
            FOR SELECT USING (true);
    END IF;
END $$;

-- 8. POLÍTICAS RLS PARA BOOKING_CLIENTS
DO $$
BEGIN
    -- Política para inserção pública (registro de clientes)
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

-- 9. POLÍTICAS RLS PARA APPOINTMENTS
DO $$
BEGIN
    -- Política para usuários autenticados gerenciarem seus agendamentos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Users can manage their own appointments'
    ) THEN
        CREATE POLICY "Users can manage their own appointments" ON public.appointments
            FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;
    
    -- Política pública para inserção de agendamentos (clientes fazendo agendamento)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Public can insert appointments for online booking'
    ) THEN
        CREATE POLICY "Public can insert appointments for online booking" ON public.appointments
            FOR INSERT WITH CHECK (true);
    END IF;
    
    -- Política pública para leitura de agendamentos (verificar disponibilidade)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Public can read appointments for availability check'
    ) THEN
        CREATE POLICY "Public can read appointments for availability check" ON public.appointments
            FOR SELECT USING (true);
    END IF;
    
    -- Política pública para atualização de agendamentos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Public can update appointments'
    ) THEN
        CREATE POLICY "Public can update appointments" ON public.appointments
            FOR UPDATE USING (true);
    END IF;
END $$;

-- 10. POLÍTICAS RLS PARA USER_PROFILES
DO $$
BEGIN
    -- Política para usuários autenticados gerenciarem seus perfis
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can manage their own profiles'
    ) THEN
        CREATE POLICY "Users can manage their own profiles" ON public.user_profiles
            FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;
    
    -- Política pública para leitura de perfis ativos (buscar admin pelo username)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Public can view active user profiles for booking'
    ) THEN
        CREATE POLICY "Public can view active user profiles for booking" ON public.user_profiles
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- 11. POLÍTICAS RLS PARA SETTINGS
DO $$
BEGIN
    -- Política para usuários autenticados gerenciarem suas configurações
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settings' 
        AND policyname = 'Users can manage their own settings'
    ) THEN
        CREATE POLICY "Users can manage their own settings" ON public.settings
            FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;
    
    -- Política pública para leitura de configurações (verificar online_enabled)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settings' 
        AND policyname = 'Public can read settings for online booking'
    ) THEN
        CREATE POLICY "Public can read settings for online booking" ON public.settings
            FOR SELECT USING (true);
    END IF;
END $$;

-- 12. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_modalities_user_id ON public.modalities(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON public.booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- 13. ADICIONAR COMENTÁRIOS
COMMENT ON TABLE public.modalities IS 'Tabela para armazenar modalidades esportivas dos usuários';
COMMENT ON TABLE public.booking_clients IS 'Tabela para armazenar clientes do agendamento online';
COMMENT ON COLUMN public.appointments.user_id IS 'ID do usuário admin (dono da agenda)';
COMMENT ON COLUMN public.appointments.client_id IS 'ID do cliente (pode ser da tabela clients ou booking_clients)';
COMMENT ON COLUMN public.settings.online_enabled IS 'Indica se o agendamento online está habilitado para este usuário';

-- 14. VERIFICAR E INSERIR DADOS DE EXEMPLO (se necessário)
-- Inserir configurações padrão para usuários existentes que não tenham settings
INSERT INTO public.settings (user_id, online_enabled, working_hours, online_booking)
SELECT 
    up.user_id,
    false, -- online_enabled padrão como false
    '{"monday":{"enabled":true,"start":"08:00","end":"18:00"},"tuesday":{"enabled":true,"start":"08:00","end":"18:00"},"wednesday":{"enabled":true,"start":"08:00","end":"18:00"},"thursday":{"enabled":true,"start":"08:00","end":"18:00"},"friday":{"enabled":true,"start":"08:00","end":"18:00"},"saturday":{"enabled":true,"start":"08:00","end":"18:00"},"sunday":{"enabled":false,"start":"08:00","end":"18:00"}}'::jsonb,
    '{"ativo":false,"auto_agendar":false,"tempo_minimo_antecedencia":24}'::jsonb
FROM public.user_profiles up
WHERE NOT EXISTS (
    SELECT 1 FROM public.settings s WHERE s.user_id = up.user_id
);

-- 15. MENSAGEM DE CONFIRMAÇÃO
DO $$
BEGIN
    RAISE NOTICE 'Sistema de agendamento online configurado com sucesso!';
    RAISE NOTICE 'Tabelas criadas/atualizadas: modalities, booking_clients';
    RAISE NOTICE 'Políticas RLS configuradas para todas as tabelas';
    RAISE NOTICE 'Índices criados para melhor performance';
    RAISE NOTICE 'Configurações padrão inseridas para usuários existentes';
END $$;
