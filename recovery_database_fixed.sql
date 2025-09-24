-- =====================================================
-- SCRIPT CORRIGIDO DE RECUPERAÇÃO DO BANCO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- AVISO: Este script executa todas as etapas de recuperação corrigidas
-- Certifique-se de ter backup antes de executar

BEGIN;

-- =====================================================
-- ETAPA 1: LIMPEZA E PREPARAÇÃO
-- =====================================================

-- Remover tabelas existentes para evitar conflitos
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.monthly_events CASCADE;
DROP TABLE IF EXISTS public.time_blockades CASCADE;
DROP TABLE IF EXISTS public.booking_clients CASCADE;
DROP TABLE IF EXISTS public.online_reservations CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.recurrences CASCADE;

-- Remover enums existentes
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS recurrence_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- =====================================================
-- ETAPA 2: CRIAR ENUMS E TABELAS BÁSICAS
-- =====================================================

-- Criar enums necessários
CREATE TYPE appointment_status AS ENUM ('a_cobrar', 'pago', 'cancelado', 'agendado');
CREATE TYPE recurrence_type AS ENUM ('data_final', 'repeticoes', 'indeterminado');
CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'cancelado');

-- Criar tabela clients
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela recurrences
CREATE TABLE public.recurrences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type recurrence_type NOT NULL,
    end_date DATE,
    repetitions INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela appointments
CREATE TABLE public.appointments (
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

-- Criar função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers básicos
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índices básicos
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_phone ON public.clients(phone);
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrences ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas
CREATE POLICY "Authenticated users can view clients" ON public.clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON public.clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" ON public.clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients" ON public.clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" ON public.appointments
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para recurrences
CREATE POLICY "Authenticated users can view recurrences" ON public.recurrences
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert recurrences" ON public.recurrences
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update recurrences" ON public.recurrences
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete recurrences" ON public.recurrences
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- ETAPA 3: SISTEMA DE PAGAMENTOS
-- =====================================================

-- Criar tabela payments (CORRIGIDA)
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  payment_method VARCHAR(50),
  mercado_pago_id VARCHAR(100),
  mercado_pago_status VARCHAR(50),
  mercado_pago_payment_id VARCHAR(100),
  mercado_pago_preference_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela settings (COMPLETA)
CREATE TABLE public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    modalities_enabled JSONB NOT NULL DEFAULT '{
        "volei": true,
        "futsal": true,
        "basquete": true
    }'::jsonb,
    modalities_colors JSONB NOT NULL DEFAULT '{
        "volei": "#3b82f6",
        "futsal": "#10b981",
        "basquete": "#f59e0b"
    }'::jsonb,
    working_hours JSONB NOT NULL DEFAULT '{
        "monday": {"start": "08:00", "end": "22:00", "enabled": true},
        "tuesday": {"start": "08:00", "end": "22:00", "enabled": true},
        "wednesday": {"start": "08:00", "end": "22:00", "enabled": true},
        "thursday": {"start": "08:00", "end": "22:00", "enabled": true},
        "friday": {"start": "08:00", "end": "22:00", "enabled": true},
        "saturday": {"start": "08:00", "end": "18:00", "enabled": true},
        "sunday": {"start": "08:00", "end": "18:00", "enabled": false}
    }'::jsonb,
    default_interval INTEGER NOT NULL DEFAULT 60,
    time_format_interval INTEGER NOT NULL DEFAULT 60 CHECK (time_format_interval IN (30, 60)),
    notifications_enabled JSONB NOT NULL DEFAULT '{
        "email": true,
        "push": false,
        "alerts": {
            "booking": true,
            "cancellation": true,
            "payment": true
        }
    }'::jsonb,
    theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'custom')),
    personal_data JSONB NOT NULL DEFAULT '{
        "name": "",
        "email": "",
        "phone": ""
    }'::jsonb,
    online_enabled BOOLEAN NOT NULL DEFAULT false,
    online_booking JSONB NOT NULL DEFAULT '{
        "auto_agendar": false,
        "tempo_minimo_antecedencia": 24,
        "duracao_padrao": 60
    }'::jsonb,
    payment_policy VARCHAR(20) NOT NULL DEFAULT 'sem_pagamento' CHECK (payment_policy IN ('sem_pagamento', 'obrigatorio', 'opcional')),
    mercado_pago_access_token VARCHAR(255),
    mercado_pago_public_key VARCHAR(255),
    mercado_pago_webhook_url VARCHAR(500),
    mercado_pago_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Criar triggers para payments e settings
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON public.settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para payments e settings
CREATE INDEX idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_mercado_pago_id ON public.payments(mercado_pago_id);
CREATE INDEX idx_settings_user_id ON public.settings(user_id);
CREATE INDEX idx_settings_payment_policy ON public.settings(payment_policy);

-- Habilitar RLS para payments e settings
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert payments for their appointments" ON public.payments
    FOR INSERT WITH CHECK (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update payments for their appointments" ON public.payments
    FOR UPDATE USING (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE user_id = auth.uid()
        )
    );

-- Criar políticas RLS para settings
CREATE POLICY "Users can view own settings" ON public.settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.settings
    FOR DELETE USING (auth.uid() = user_id);

-- Garantir que todos os usuários tenham configurações padrão
INSERT INTO public.settings (user_id, payment_policy, mercado_pago_enabled)
SELECT 
    id as user_id,
    'sem_pagamento' as payment_policy,
    false as mercado_pago_enabled
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.settings)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- ETAPA 4: TABELAS AUXILIARES
-- =====================================================

-- Criar tabela monthly_events
CREATE TABLE public.monthly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  client_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  notes TEXT,
  guests INTEGER NOT NULL DEFAULT 0,
  phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('a_cobrar','pago','cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela time_blockades
CREATE TABLE public.time_blockades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  original_date DATE,
  end_date DATE,
  is_indefinite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela booking_clients
CREATE TABLE public.booking_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela online_reservations
CREATE TABLE public.online_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    modalidade_id UUID,
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

-- Criar triggers para tabelas auxiliares
CREATE TRIGGER trg_monthly_events_updated_at
    BEFORE UPDATE ON public.monthly_events
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_time_blockades_updated_at
    BEFORE UPDATE ON public.time_blockades
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_booking_clients_updated_at
    BEFORE UPDATE ON public.booking_clients
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_online_reservations_updated_at
    BEFORE UPDATE ON public.online_reservations
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para tabelas auxiliares
CREATE INDEX idx_monthly_events_user_id ON public.monthly_events(user_id);
CREATE INDEX idx_monthly_events_event_date ON public.monthly_events(event_date);
CREATE INDEX idx_time_blockades_user_id ON public.time_blockades(user_id);
CREATE INDEX idx_time_blockades_date ON public.time_blockades(date);
CREATE INDEX idx_booking_clients_user_id ON public.booking_clients(user_id);
CREATE INDEX idx_online_reservations_admin_user_id ON public.online_reservations(admin_user_id);

-- Habilitar RLS para tabelas auxiliares
ALTER TABLE public.monthly_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blockades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_reservations ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para tabelas auxiliares
-- Monthly Events
CREATE POLICY "Users can view own monthly_events" ON public.monthly_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly_events" ON public.monthly_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly_events" ON public.monthly_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly_events" ON public.monthly_events
  FOR DELETE USING (auth.uid() = user_id);

-- Time Blockades
CREATE POLICY "Users can view own time_blockades" ON public.time_blockades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time_blockades" ON public.time_blockades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time_blockades" ON public.time_blockades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time_blockades" ON public.time_blockades
  FOR DELETE USING (auth.uid() = user_id);

-- Booking Clients
CREATE POLICY "Users can view own booking_clients" ON public.booking_clients
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own booking_clients" ON public.booking_clients
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own booking_clients" ON public.booking_clients
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own booking_clients" ON public.booking_clients
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Online Reservations
CREATE POLICY "Users can view own online_reservations" ON public.online_reservations
    FOR SELECT USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can insert own online_reservations" ON public.online_reservations
    FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Users can update own online_reservations" ON public.online_reservations
    FOR UPDATE USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can delete own online_reservations" ON public.online_reservations
    FOR DELETE USING (auth.uid() = admin_user_id);

-- Permitir acesso público para reservas online
CREATE POLICY "Public can insert online_reservations" ON public.online_reservations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert booking_clients" ON public.booking_clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view booking_clients" ON public.booking_clients
    FOR SELECT USING (true);

-- =====================================================
-- VERIFICAÇÃO FINAL SIMPLIFICADA
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT 'Verificando tabelas criadas:' as info;

SELECT 
    table_name,
    '✅ Criada' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'appointments', 'payments', 'settings', 'monthly_events', 'time_blockades', 'booking_clients', 'online_reservations', 'recurrences')
ORDER BY table_name;

-- Verificar estrutura da tabela settings
SELECT 'Estrutura da tabela settings:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settings' AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;

SELECT '🎉 RECUPERAÇÃO COMPLETA FINALIZADA! Sistema pronto para uso!' as status_final;
