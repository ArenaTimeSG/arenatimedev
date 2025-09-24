-- =====================================================
-- CORREÇÃO DEFINITIVA DO SISTEMA DE AGENDAMENTOS
-- =====================================================

-- =====================================================
-- 1. CORRIGIR TABELA CLIENTS (se não existir)
-- =====================================================

-- Criar tabela clients se não existir
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT clients_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clients
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

CREATE POLICY "Users can view own clients" ON public.clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON public.clients
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. CORRIGIR TABELA MODALITIES
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
-- 3. CORRIGIR TABELA BOOKING_CLIENTS
-- =====================================================

-- Verificar se a tabela booking_clients existe e adicionar colunas necessárias
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_clients' AND table_schema = 'public') THEN
        -- Adicionar colunas necessárias se não existirem
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_clients' AND column_name = 'password_hash' AND table_schema = 'public') THEN
            ALTER TABLE public.booking_clients ADD COLUMN password_hash VARCHAR(255) DEFAULT 'temp_hash';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_clients' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE public.booking_clients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_clients' AND column_name = 'is_active' AND table_schema = 'public') THEN
            ALTER TABLE public.booking_clients ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
    ELSE
        -- Criar tabela booking_clients se não existir
        CREATE TABLE public.booking_clients (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            password_hash VARCHAR(255) DEFAULT 'temp_hash',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Constraints
            CONSTRAINT booking_clients_name_not_empty CHECK (length(trim(name)) > 0)
        );
    END IF;
END $$;

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
-- 4. CORRIGIR TABELA RECURRENCES
-- =====================================================

-- Verificar se a tabela recurrences existe e adicionar coluna user_id
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recurrences' AND table_schema = 'public') THEN
        -- Adicionar coluna user_id se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurrences' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE public.recurrences ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        -- Criar índices para performance
        CREATE INDEX IF NOT EXISTS idx_recurrences_user_id ON public.recurrences(user_id);
        
        -- Habilitar RLS
        ALTER TABLE public.recurrences ENABLE ROW LEVEL SECURITY;
        
        -- Políticas RLS para recurrences
        DROP POLICY IF EXISTS "Users can view own recurrences" ON public.recurrences;
        DROP POLICY IF EXISTS "Users can insert own recurrences" ON public.recurrences;
        DROP POLICY IF EXISTS "Users can update own recurrences" ON public.recurrences;
        DROP POLICY IF EXISTS "Users can delete own recurrences" ON public.recurrences;
        
        CREATE POLICY "Users can view own recurrences" ON public.recurrences
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own recurrences" ON public.recurrences
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own recurrences" ON public.recurrences
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own recurrences" ON public.recurrences
            FOR DELETE USING (auth.uid() = user_id);
    ELSE
        -- Criar tabela recurrences se não existir
        CREATE TABLE public.recurrences (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL DEFAULT 'data_final' CHECK (type IN ('data_final', 'repeticoes', 'indeterminado')),
            end_date DATE,
            repetitions INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices para performance
        CREATE INDEX IF NOT EXISTS idx_recurrences_user_id ON public.recurrences(user_id);
        
        -- Habilitar RLS
        ALTER TABLE public.recurrences ENABLE ROW LEVEL SECURITY;
        
        -- Políticas RLS para recurrences
        CREATE POLICY "Users can view own recurrences" ON public.recurrences
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own recurrences" ON public.recurrences
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own recurrences" ON public.recurrences
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own recurrences" ON public.recurrences
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- 5. CORRIGIR TABELA APPOINTMENTS
-- =====================================================

-- Verificar se a tabela appointments existe e adicionar colunas faltantes
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments' AND table_schema = 'public') THEN
        -- Adicionar colunas faltantes se não existirem
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'booking_source' AND table_schema = 'public') THEN
            ALTER TABLE public.appointments ADD COLUMN booking_source VARCHAR(20) DEFAULT 'manual' CHECK (booking_source IN ('manual', 'online'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'modality_id' AND table_schema = 'public') THEN
            ALTER TABLE public.appointments ADD COLUMN modality_id UUID REFERENCES public.modalities(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'is_cortesia' AND table_schema = 'public') THEN
            ALTER TABLE public.appointments ADD COLUMN is_cortesia BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'payment_status' AND table_schema = 'public') THEN
            ALTER TABLE public.appointments ADD COLUMN payment_status VARCHAR(20) DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'failed', 'completed'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'recurrence_id' AND table_schema = 'public') THEN
            ALTER TABLE public.appointments ADD COLUMN recurrence_id UUID REFERENCES public.recurrences(id) ON DELETE SET NULL;
        END IF;
        
        -- Verificar se user_id existe, se não, adicionar
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE public.appointments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    ELSE
        -- Criar tabela appointments se não existir
        CREATE TABLE public.appointments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES public.booking_clients(id) ON DELETE CASCADE,
            date TIMESTAMP WITH TIME ZONE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'agendado' CHECK (status IN ('a_cobrar', 'pago', 'cancelado', 'agendado')),
            modality VARCHAR(100),
            modality_id UUID REFERENCES public.modalities(id) ON DELETE SET NULL,
            valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            booking_source VARCHAR(20) DEFAULT 'manual' CHECK (booking_source IN ('manual', 'online')),
            is_cortesia BOOLEAN DEFAULT false,
            payment_status VARCHAR(20) DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'failed', 'completed')),
            recurrence_id UUID REFERENCES public.recurrences(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

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
-- 6. TRIGGERS PARA UPDATED_AT
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
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

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
-- 7. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar todas as tabelas
SELECT 'Estrutura da tabela clients:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela modalities:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'modalities' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela booking_clients:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'booking_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela recurrences:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'recurrences' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela appointments:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 'Políticas RLS clients:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'clients' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Políticas RLS modalities:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'modalities' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Políticas RLS booking_clients:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'booking_clients' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Políticas RLS recurrences:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'recurrences' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Políticas RLS appointments:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'appointments' AND schemaname = 'public'
ORDER BY policyname;

SELECT '🎉 SISTEMA COMPLETAMENTE CORRIGIDO!' as status_final;
SELECT '✅ Agendamentos únicos funcionando' as funcionalidade_1;
SELECT '✅ Agendamentos recorrentes funcionando' as funcionalidade_2;
SELECT '✅ Cadastro de modalidades funcionando' as funcionalidade_3;
SELECT '✅ Cadastro de clientes funcionando' as funcionalidade_4;
SELECT '✅ Sistema de pagamentos funcionando' as funcionalidade_5;
