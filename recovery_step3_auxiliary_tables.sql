-- =====================================================
-- ETAPA 3: CRIAR TABELAS AUXILIARES
-- Execute este script APÓS a ETAPA 2
-- =====================================================

-- 1. CRIAR TABELA MONTHLY_EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.monthly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  client_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  start_time TEXT NOT NULL, -- HH:mm
  end_time TEXT NOT NULL,   -- HH:mm
  notes TEXT,
  guests INTEGER NOT NULL DEFAULT 0,
  phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('a_cobrar','pago','cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários da tabela monthly_events
COMMENT ON TABLE public.monthly_events IS 'Tabela de eventos mensais (agenda sem horários padrão)';
COMMENT ON COLUMN public.monthly_events.user_id IS 'ID do usuário administrador';
COMMENT ON COLUMN public.monthly_events.event_date IS 'Data do evento';
COMMENT ON COLUMN public.monthly_events.client_name IS 'Nome do cliente';
COMMENT ON COLUMN public.monthly_events.amount IS 'Valor do evento';
COMMENT ON COLUMN public.monthly_events.start_time IS 'Horário de início (HH:mm)';
COMMENT ON COLUMN public.monthly_events.end_time IS 'Horário de fim (HH:mm)';
COMMENT ON COLUMN public.monthly_events.notes IS 'Observações do evento';
COMMENT ON COLUMN public.monthly_events.guests IS 'Número de convidados';
COMMENT ON COLUMN public.monthly_events.phone IS 'Telefone do cliente (opcional)';
COMMENT ON COLUMN public.monthly_events.status IS 'Status do evento: a_cobrar, pago, cancelado';

-- Índices para monthly_events
CREATE INDEX IF NOT EXISTS idx_monthly_events_user_id ON public.monthly_events(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_events_event_date ON public.monthly_events(event_date);
CREATE INDEX IF NOT EXISTS idx_monthly_events_status ON public.monthly_events(status);
CREATE INDEX IF NOT EXISTS idx_monthly_events_user_date ON public.monthly_events(user_id, event_date);

-- 2. CRIAR TABELA TIME_BLOCKADES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.time_blockades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL, -- HH:mm
  end_time TEXT NOT NULL,   -- HH:mm
  reason TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  original_date DATE,
  end_date DATE,
  is_indefinite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários da tabela time_blockades
COMMENT ON TABLE public.time_blockades IS 'Tabela de bloqueios de horários';
COMMENT ON COLUMN public.time_blockades.user_id IS 'ID do usuário administrador';
COMMENT ON COLUMN public.time_blockades.date IS 'Data do bloqueio';
COMMENT ON COLUMN public.time_blockades.start_time IS 'Horário de início do bloqueio (HH:mm)';
COMMENT ON COLUMN public.time_blockades.end_time IS 'Horário de fim do bloqueio (HH:mm)';
COMMENT ON COLUMN public.time_blockades.reason IS 'Motivo do bloqueio';
COMMENT ON COLUMN public.time_blockades.is_recurring IS 'Indica se este bloqueio é parte de uma série recorrente';
COMMENT ON COLUMN public.time_blockades.recurrence_type IS 'Tipo de recorrência: daily, weekly, monthly';
COMMENT ON COLUMN public.time_blockades.original_date IS 'Data original quando o bloqueio recorrente foi criado';
COMMENT ON COLUMN public.time_blockades.end_date IS 'Data final para a série de bloqueios recorrentes';
COMMENT ON COLUMN public.time_blockades.is_indefinite IS 'Indica se o bloqueio recorrente não tem data final';

-- Índices para time_blockades
CREATE INDEX IF NOT EXISTS idx_time_blockades_user_id ON public.time_blockades(user_id);
CREATE INDEX IF NOT EXISTS idx_time_blockades_date ON public.time_blockades(date);
CREATE INDEX IF NOT EXISTS idx_time_blockades_recurrence ON public.time_blockades(is_recurring, original_date, recurrence_type);
CREATE INDEX IF NOT EXISTS idx_time_blockades_user_date ON public.time_blockades(user_id, date);

-- 3. CRIAR TABELA BOOKING_CLIENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.booking_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários da tabela booking_clients
COMMENT ON TABLE public.booking_clients IS 'Tabela de clientes para reservas online';
COMMENT ON COLUMN public.booking_clients.user_id IS 'ID do usuário administrador (opcional)';
COMMENT ON COLUMN public.booking_clients.name IS 'Nome do cliente';
COMMENT ON COLUMN public.booking_clients.email IS 'Email do cliente';
COMMENT ON COLUMN public.booking_clients.phone IS 'Telefone do cliente';

-- Índices para booking_clients
CREATE INDEX IF NOT EXISTS idx_booking_clients_user_id ON public.booking_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON public.booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_booking_clients_phone ON public.booking_clients(phone);

-- 4. CRIAR TABELA ONLINE_RESERVATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.online_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    modalidade_id UUID, -- Referência opcional para modalidades
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

-- Comentários da tabela online_reservations
COMMENT ON TABLE public.online_reservations IS 'Tabela de reservas online';
COMMENT ON COLUMN public.online_reservations.admin_user_id IS 'ID do usuário administrador';
COMMENT ON COLUMN public.online_reservations.modalidade_id IS 'ID da modalidade (opcional)';
COMMENT ON COLUMN public.online_reservations.data IS 'Data da reserva';
COMMENT ON COLUMN public.online_reservations.horario IS 'Horário da reserva';
COMMENT ON COLUMN public.online_reservations.cliente_nome IS 'Nome do cliente';
COMMENT ON COLUMN public.online_reservations.cliente_email IS 'Email do cliente';
COMMENT ON COLUMN public.online_reservations.cliente_telefone IS 'Telefone do cliente';
COMMENT ON COLUMN public.online_reservations.valor IS 'Valor da reserva';
COMMENT ON COLUMN public.online_reservations.status IS 'Status da reserva: pendente, confirmada, cancelada, realizada';
COMMENT ON COLUMN public.online_reservations.auto_confirmada IS 'Se a reserva foi confirmada automaticamente';

-- Índices para online_reservations
CREATE INDEX IF NOT EXISTS idx_online_reservations_admin_user_id ON public.online_reservations(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_online_reservations_modalidade_id ON public.online_reservations(modalidade_id);
CREATE INDEX IF NOT EXISTS idx_online_reservations_data ON public.online_reservations(data);
CREATE INDEX IF NOT EXISTS idx_online_reservations_status ON public.online_reservations(status);
CREATE INDEX IF NOT EXISTS idx_online_reservations_admin_data ON public.online_reservations(admin_user_id, data);

-- 5. CRIAR TRIGGERS PARA UPDATED_AT
-- =====================================================
-- Trigger para monthly_events
DROP TRIGGER IF EXISTS trg_monthly_events_updated_at ON public.monthly_events;
CREATE TRIGGER trg_monthly_events_updated_at
    BEFORE UPDATE ON public.monthly_events
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para time_blockades
DROP TRIGGER IF EXISTS trg_time_blockades_updated_at ON public.time_blockades;
CREATE TRIGGER trg_time_blockades_updated_at
    BEFORE UPDATE ON public.time_blockades
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para booking_clients
DROP TRIGGER IF EXISTS trg_booking_clients_updated_at ON public.booking_clients;
CREATE TRIGGER trg_booking_clients_updated_at
    BEFORE UPDATE ON public.booking_clients
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para online_reservations
DROP TRIGGER IF EXISTS trigger_update_online_reservations_updated_at ON public.online_reservations;
CREATE TRIGGER trigger_update_online_reservations_updated_at
    BEFORE UPDATE ON public.online_reservations
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. HABILITAR ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.monthly_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blockades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_reservations ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS RLS PARA MONTHLY_EVENTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view own monthly_events" ON public.monthly_events;
CREATE POLICY "Users can view own monthly_events" ON public.monthly_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own monthly_events" ON public.monthly_events;
CREATE POLICY "Users can insert own monthly_events" ON public.monthly_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own monthly_events" ON public.monthly_events;
CREATE POLICY "Users can update own monthly_events" ON public.monthly_events
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own monthly_events" ON public.monthly_events;
CREATE POLICY "Users can delete own monthly_events" ON public.monthly_events
  FOR DELETE USING (auth.uid() = user_id);

-- 8. CRIAR POLÍTICAS RLS PARA TIME_BLOCKADES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own time_blockades" ON public.time_blockades;
CREATE POLICY "Users can view own time_blockades" ON public.time_blockades
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own time_blockades" ON public.time_blockades;
CREATE POLICY "Users can insert own time_blockades" ON public.time_blockades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own time_blockades" ON public.time_blockades;
CREATE POLICY "Users can update own time_blockades" ON public.time_blockades
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own time_blockades" ON public.time_blockades;
CREATE POLICY "Users can delete own time_blockades" ON public.time_blockades
  FOR DELETE USING (auth.uid() = user_id);

-- 9. CRIAR POLÍTICAS RLS PARA BOOKING_CLIENTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view own booking_clients" ON public.booking_clients;
CREATE POLICY "Users can view own booking_clients" ON public.booking_clients
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert own booking_clients" ON public.booking_clients;
CREATE POLICY "Users can insert own booking_clients" ON public.booking_clients
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own booking_clients" ON public.booking_clients;
CREATE POLICY "Users can update own booking_clients" ON public.booking_clients
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete own booking_clients" ON public.booking_clients;
CREATE POLICY "Users can delete own booking_clients" ON public.booking_clients
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 10. CRIAR POLÍTICAS RLS PARA ONLINE_RESERVATIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view own online_reservations" ON public.online_reservations;
CREATE POLICY "Users can view own online_reservations" ON public.online_reservations
    FOR SELECT USING (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "Users can insert own online_reservations" ON public.online_reservations;
CREATE POLICY "Users can insert own online_reservations" ON public.online_reservations
    FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "Users can update own online_reservations" ON public.online_reservations;
CREATE POLICY "Users can update own online_reservations" ON public.online_reservations
    FOR UPDATE USING (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "Users can delete own online_reservations" ON public.online_reservations;
CREATE POLICY "Users can delete own online_reservations" ON public.online_reservations
    FOR DELETE USING (auth.uid() = admin_user_id);

-- 11. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'ETAPA 3 CONCLUÍDA: Tabelas auxiliares criadas com sucesso!' as status;

-- Mostrar estrutura das tabelas criadas
SELECT 'Estrutura da tabela monthly_events:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'monthly_events' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela time_blockades:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'time_blockades' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela booking_clients:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela online_reservations:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'online_reservations' AND table_schema = 'public'
ORDER BY ordinal_position;
