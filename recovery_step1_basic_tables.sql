-- =====================================================
-- ETAPA 1: CRIAR TABELAS BÁSICAS DO SISTEMA
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. CRIAR ENUMS NECESSÁRIOS
-- =====================================================
DO $$ 
BEGIN
    -- Criar enum para status de agendamentos
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('a_cobrar', 'pago', 'cancelado', 'agendado');
    END IF;
    
    -- Criar enum para tipo de recorrência
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_type') THEN
        CREATE TYPE recurrence_type AS ENUM ('data_final', 'repeticoes', 'indeterminado');
    END IF;
    
    -- Criar enum para status de pagamento
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'cancelado');
    END IF;
END $$;

-- 2. CRIAR TABELA CLIENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários da tabela clients
COMMENT ON TABLE public.clients IS 'Tabela de clientes do sistema';
COMMENT ON COLUMN public.clients.name IS 'Nome completo do cliente';
COMMENT ON COLUMN public.clients.phone IS 'Telefone do cliente (opcional)';
COMMENT ON COLUMN public.clients.email IS 'Email do cliente (opcional)';

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

-- 3. CRIAR TABELA RECURRENCES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recurrences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type recurrence_type NOT NULL,
    end_date DATE,
    repetitions INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comentários da tabela recurrences
COMMENT ON TABLE public.recurrences IS 'Tabela de configurações de recorrência';
COMMENT ON COLUMN public.recurrences.type IS 'Tipo de recorrência: data_final, repeticoes, indeterminado';
COMMENT ON COLUMN public.recurrences.end_date IS 'Data final da recorrência (se aplicável)';
COMMENT ON COLUMN public.recurrences.repetitions IS 'Número de repetições (se aplicável)';

-- 4. CRIAR TABELA APPOINTMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status NOT NULL DEFAULT 'a_cobrar',
    recurrence_id UUID REFERENCES public.recurrences(id) ON DELETE SET NULL,
    modality TEXT,
    valor_total DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'approved', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários da tabela appointments
COMMENT ON TABLE public.appointments IS 'Tabela de agendamentos';
COMMENT ON COLUMN public.appointments.user_id IS 'ID do usuário administrador';
COMMENT ON COLUMN public.appointments.client_id IS 'ID do cliente';
COMMENT ON COLUMN public.appointments.date IS 'Data e hora do agendamento';
COMMENT ON COLUMN public.appointments.status IS 'Status do agendamento: a_cobrar, pago, cancelado, agendado';
COMMENT ON COLUMN public.appointments.modality IS 'Modalidade do agendamento';
COMMENT ON COLUMN public.appointments.valor_total IS 'Valor total do agendamento';
COMMENT ON COLUMN public.appointments.payment_status IS 'Status do pagamento: not_required, pending, approved, failed';

-- Índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON public.appointments(user_id, date);

-- 5. CRIAR FUNÇÃO PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. CRIAR TRIGGERS PARA UPDATED_AT
-- =====================================================
-- Trigger para clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para appointments
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. HABILITAR ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrences ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR POLÍTICAS RLS BÁSICAS
-- =====================================================
-- Políticas para clients
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
CREATE POLICY "Users can view own clients" ON public.clients
    FOR SELECT USING (true); -- Temporário - será ajustado depois

DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
CREATE POLICY "Users can insert own clients" ON public.clients
    FOR INSERT WITH CHECK (true); -- Temporário

DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
CREATE POLICY "Users can update own clients" ON public.clients
    FOR UPDATE USING (true); -- Temporário

DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
CREATE POLICY "Users can delete own clients" ON public.clients
    FOR DELETE USING (true); -- Temporário

-- Políticas para appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
CREATE POLICY "Users can insert own appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
CREATE POLICY "Users can delete own appointments" ON public.appointments
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para recurrences
DROP POLICY IF EXISTS "Users can view recurrences" ON public.recurrences;
CREATE POLICY "Users can view recurrences" ON public.recurrences
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert recurrences" ON public.recurrences;
CREATE POLICY "Users can insert recurrences" ON public.recurrences
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update recurrences" ON public.recurrences;
CREATE POLICY "Users can update recurrences" ON public.recurrences
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete recurrences" ON public.recurrences;
CREATE POLICY "Users can delete recurrences" ON public.recurrences
    FOR DELETE USING (true);

-- 9. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'ETAPA 1 CONCLUÍDA: Tabelas básicas criadas com sucesso!' as status;

-- Mostrar estrutura das tabelas criadas
SELECT 'Estrutura da tabela clients:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela appointments:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela recurrences:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'recurrences' AND table_schema = 'public'
ORDER BY ordinal_position;
