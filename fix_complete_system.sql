-- =====================================================
-- CORREÇÃO COMPLETA DO SISTEMA DE AGENDAMENTOS
-- =====================================================

-- =====================================================
-- 1. CORREÇÃO DA TABELA MODALITIES
-- =====================================================

-- Criar tabela modalities se não existir
CREATE TABLE IF NOT EXISTS public.modalities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT modalities_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT modalities_valor_positive CHECK (valor >= 0)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_modalities_user_id ON public.modalities(user_id);
CREATE INDEX IF NOT EXISTS idx_modalities_name ON public.modalities(name);

-- Habilitar RLS
ALTER TABLE public.modalities ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para modalities
DROP POLICY IF EXISTS "Users can view own modalities" ON public.modalities;
DROP POLICY IF EXISTS "Users can create own modalities" ON public.modalities;
DROP POLICY IF EXISTS "Users can update own modalities" ON public.modalities;
DROP POLICY IF EXISTS "Users can delete own modalities" ON public.modalities;

CREATE POLICY "Users can view own modalities" ON public.modalities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own modalities" ON public.modalities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own modalities" ON public.modalities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own modalities" ON public.modalities
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. CORREÇÃO DA TABELA BOOKING_CLIENTS
-- =====================================================

-- Verificar e adicionar colunas necessárias
ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT 'temp_hash';

ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_booking_clients_user_id ON public.booking_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON public.booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_booking_clients_phone ON public.booking_clients(phone);

-- Habilitar RLS
ALTER TABLE public.booking_clients ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can insert own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can update own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Users can delete own booking_clients" ON public.booking_clients;
DROP POLICY IF EXISTS "Public can view booking_clients" ON public.booking_clients;

-- Criar políticas RLS para booking_clients
CREATE POLICY "Users can view own booking_clients" ON public.booking_clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own booking_clients" ON public.booking_clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own booking_clients" ON public.booking_clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own booking_clients" ON public.booking_clients
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view booking_clients" ON public.booking_clients
    FOR SELECT USING (true);

-- =====================================================
-- 3. CORREÇÃO DA TABELA APPOINTMENTS
-- =====================================================

-- Adicionar colunas faltantes
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS booking_source VARCHAR(20) DEFAULT 'manual' CHECK (booking_source IN ('manual', 'online'));

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS modality_id UUID REFERENCES public.modalities(id) ON DELETE SET NULL;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS is_cortesia BOOLEAN DEFAULT false;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'failed', 'completed'));

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS recurrence_id UUID REFERENCES public.recurrences(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_modality_id ON public.appointments(modality_id);
CREATE INDEX IF NOT EXISTS idx_appointments_recurrence_id ON public.appointments(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_source ON public.appointments(booking_source);

-- Habilitar RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can view appointments" ON public.appointments;

-- Criar políticas RLS para appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" ON public.appointments
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view appointments" ON public.appointments
    FOR SELECT USING (true);

-- =====================================================
-- 4. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_modalities_updated_at ON public.modalities;
CREATE TRIGGER update_modalities_updated_at
    BEFORE UPDATE ON public.modalities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_clients_updated_at ON public.booking_clients;
CREATE TRIGGER update_booking_clients_updated_at
    BEFORE UPDATE ON public.booking_clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar tabela modalities
SELECT 'Estrutura da tabela modalities:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'modalities' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar tabela booking_clients
SELECT 'Estrutura da tabela booking_clients:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar tabela appointments
SELECT 'Estrutura da tabela appointments:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 'Políticas RLS modalities:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'modalities' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Políticas RLS booking_clients:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'booking_clients' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Políticas RLS appointments:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'appointments' AND schemaname = 'public'
ORDER BY policyname;

SELECT '🎉 SISTEMA COMPLETO CORRIGIDO! Agora você pode:' as status_final;
SELECT '✅ Cadastrar modalidades' as funcionalidade_1;
SELECT '✅ Cadastrar clientes' as funcionalidade_2;
SELECT '✅ Criar agendamentos únicos' as funcionalidade_3;
SELECT '✅ Criar agendamentos recorrentes' as funcionalidade_4;
SELECT '✅ Gerenciar pagamentos' as funcionalidade_5;
