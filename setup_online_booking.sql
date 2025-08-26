-- =====================================================
-- Configuração do Sistema de Agendamento Online
-- =====================================================

-- 1. Criar tabela booking_clients para clientes autenticados
CREATE TABLE IF NOT EXISTS public.booking_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON public.booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_booking_clients_active ON public.booking_clients(is_active);

-- 3. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_booking_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para atualizar updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_booking_clients_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_booking_clients_updated_at
            BEFORE UPDATE ON public.booking_clients
            FOR EACH ROW
            EXECUTE FUNCTION update_booking_clients_updated_at();
    END IF;
END $$;

-- 5. Configurar RLS (Row Level Security)
ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para booking_clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'booking_clients' 
        AND policyname = 'Clients can view their own data'
    ) THEN
        CREATE POLICY "Clients can view their own data" ON public.booking_clients
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'booking_clients' 
        AND policyname = 'Public can insert booking clients'
    ) THEN
        CREATE POLICY "Public can insert booking clients" ON public.booking_clients
            FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'booking_clients' 
        AND policyname = 'Clients can update their own data'
    ) THEN
        CREATE POLICY "Clients can update their own data" ON public.booking_clients
            FOR UPDATE USING (true);
    END IF;
END $$;

-- 7. Verificar se a tabela user_profiles existe e adicionar constraint única no username dos admins
DO $$
BEGIN
    -- Verificar se a tabela user_profiles existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) THEN
        -- Verificar se a constraint já existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_profiles_username_unique'
        ) THEN
            ALTER TABLE public.user_profiles
            ADD CONSTRAINT user_profiles_username_unique UNIQUE (username);
        END IF;
    END IF;
END $$;

-- 8. Criar índice para melhor performance nas buscas por username
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
    END IF;
END $$;

-- 9. Verificar se a tabela online_reservations existe, se não, criar
CREATE TABLE IF NOT EXISTS public.online_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    modalidade_id UUID NOT NULL REFERENCES public.modalities(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255) NOT NULL,
    cliente_telefone VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'cancelada', 'realizada')),
    auto_confirmada BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Criar índices para online_reservations
CREATE INDEX IF NOT EXISTS idx_online_reservations_admin_user_id ON public.online_reservations(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_online_reservations_modalidade_id ON public.online_reservations(modalidade_id);
CREATE INDEX IF NOT EXISTS idx_online_reservations_data ON public.online_reservations(data);
CREATE INDEX IF NOT EXISTS idx_online_reservations_status ON public.online_reservations(status);
CREATE INDEX IF NOT EXISTS idx_online_reservations_admin_data ON public.online_reservations(admin_user_id, data);

-- 11. Configurar RLS para online_reservations
ALTER TABLE public.online_reservations ENABLE ROW LEVEL SECURITY;

-- 12. Políticas para online_reservations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'online_reservations' 
        AND policyname = 'Admins can view their own online reservations'
    ) THEN
        CREATE POLICY "Admins can view their own online reservations" ON public.online_reservations
            FOR SELECT USING (auth.uid() = admin_user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'online_reservations' 
        AND policyname = 'Admins can insert online reservations'
    ) THEN
        CREATE POLICY "Admins can insert online reservations" ON public.online_reservations
            FOR INSERT WITH CHECK (auth.uid() = admin_user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'online_reservations' 
        AND policyname = 'Admins can update their own online reservations'
    ) THEN
        CREATE POLICY "Admins can update their own online reservations" ON public.online_reservations
            FOR UPDATE USING (auth.uid() = admin_user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'online_reservations' 
        AND policyname = 'Public can insert online reservations'
    ) THEN
        CREATE POLICY "Public can insert online reservations" ON public.online_reservations
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 13. Adicionar coluna online_booking se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'online_booking'
    ) THEN
        ALTER TABLE public.settings 
        ADD COLUMN online_booking JSONB DEFAULT jsonb_build_object(
            'ativo', true,
            'auto_agendar', false,
            'tempo_minimo_antecedencia', 24,
            'horario_inicio', '08:00',
            'horario_fim', '22:00'
        );
    ELSE
        -- Se a coluna já existe, apenas atualizar valores nulos
        UPDATE public.settings 
        SET online_booking = jsonb_build_object(
            'ativo', true,
            'auto_agendar', false,
            'tempo_minimo_antecedencia', 24,
            'horario_inicio', '08:00',
            'horario_fim', '22:00'
        )
        WHERE online_booking IS NULL;
    END IF;
END $$;

-- 14. Comentários nas tabelas
COMMENT ON TABLE public.booking_clients IS 'Tabela para armazenar clientes autenticados do agendamento online';
COMMENT ON COLUMN public.booking_clients.name IS 'Nome completo do cliente';
COMMENT ON COLUMN public.booking_clients.email IS 'Email único do cliente';
COMMENT ON COLUMN public.booking_clients.password_hash IS 'Hash da senha do cliente';
COMMENT ON COLUMN public.booking_clients.phone IS 'Telefone do cliente';
COMMENT ON COLUMN public.booking_clients.is_active IS 'Se o cliente está ativo';

COMMENT ON TABLE public.online_reservations IS 'Tabela para armazenar reservas feitas online pelos clientes';
COMMENT ON COLUMN public.online_reservations.admin_user_id IS 'ID do usuário administrador da agenda';
COMMENT ON COLUMN public.online_reservations.modalidade_id IS 'ID da modalidade selecionada';
COMMENT ON COLUMN public.online_reservations.data IS 'Data da reserva';
COMMENT ON COLUMN public.online_reservations.horario IS 'Horário da reserva';
COMMENT ON COLUMN public.online_reservations.cliente_nome IS 'Nome do cliente';
COMMENT ON COLUMN public.online_reservations.cliente_email IS 'Email do cliente';
COMMENT ON COLUMN public.online_reservations.cliente_telefone IS 'Telefone do cliente';
COMMENT ON COLUMN public.online_reservations.valor IS 'Valor da reserva';

-- 15. Verificar se a política pública de leitura de user_profiles existe
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

-- 16. Mensagem de sucesso
SELECT 'Sistema de agendamento online configurado com sucesso!' as status;
