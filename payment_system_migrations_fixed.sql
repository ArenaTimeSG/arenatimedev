-- =====================================================
-- MIGRAÇÕES CORRIGIDAS PARA O SISTEMA DE PAGAMENTOS
-- =====================================================
-- Execute estas migrações no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/xtufbfvrgpzqbvdfmtiy/sql

-- 1. ADICIONAR POLÍTICA DE PAGAMENTO À TABELA SETTINGS
-- =====================================================
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS payment_policy VARCHAR(20) NOT NULL DEFAULT 'sem_pagamento' 
CHECK (payment_policy IN ('sem_pagamento', 'obrigatorio', 'opcional'));

COMMENT ON COLUMN public.settings.payment_policy IS 'Política de pagamento: sem_pagamento, obrigatorio, opcional';

CREATE INDEX IF NOT EXISTS idx_settings_payment_policy ON public.settings(payment_policy);

UPDATE public.settings 
SET payment_policy = 'sem_pagamento' 
WHERE payment_policy IS NULL;

-- 2. CRIAR TABELA DE PAGAMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  payment_method VARCHAR(50),
  mercado_pago_id VARCHAR(100),
  mercado_pago_status VARCHAR(50),
  mercado_pago_payment_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela payments
COMMENT ON TABLE public.payments IS 'Tabela para armazenar informações de pagamentos dos agendamentos';
COMMENT ON COLUMN public.payments.appointment_id IS 'ID do agendamento relacionado';
COMMENT ON COLUMN public.payments.amount IS 'Valor do pagamento em reais';
COMMENT ON COLUMN public.payments.currency IS 'Moeda do pagamento (padrão: BRL)';
COMMENT ON COLUMN public.payments.status IS 'Status do pagamento: pending, approved, rejected, cancelled';
COMMENT ON COLUMN public.payments.payment_method IS 'Método de pagamento usado';
COMMENT ON COLUMN public.payments.mercado_pago_id IS 'ID da preferência no Mercado Pago';
COMMENT ON COLUMN public.payments.mercado_pago_status IS 'Status retornado pelo Mercado Pago';
COMMENT ON COLUMN public.payments.mercado_pago_payment_id IS 'ID do pagamento no Mercado Pago';

-- Índices para a tabela payments
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_mercado_pago_id ON public.payments(mercado_pago_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- 3. CRIAR FUNÇÃO E TRIGGER PARA UPDATED_AT (COM VERIFICAÇÃO)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger existente se houver e criar novamente
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. ADICIONAR COLUNA DE STATUS DE PAGAMENTO NA TABELA APPOINTMENTS
-- =====================================================
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'not_required' 
CHECK (payment_status IN ('not_required', 'pending', 'failed'));

COMMENT ON COLUMN public.appointments.payment_status IS 'Status do pagamento do agendamento: not_required, pending, failed. Quando pago, o status principal vira "pago"';

CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);

UPDATE public.appointments 
SET payment_status = 'not_required' 
WHERE payment_status IS NULL;

-- 5. ADICIONAR CONFIGURAÇÕES DO MERCADO PAGO À TABELA SETTINGS
-- =====================================================
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS mercado_pago_access_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS mercado_pago_public_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS mercado_pago_webhook_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS mercado_pago_enabled BOOLEAN DEFAULT false;

-- Comentários das colunas do Mercado Pago
COMMENT ON COLUMN public.settings.mercado_pago_access_token IS 'Access Token do Mercado Pago para este usuário';
COMMENT ON COLUMN public.settings.mercado_pago_public_key IS 'Public Key do Mercado Pago para este usuário';
COMMENT ON COLUMN public.settings.mercado_pago_webhook_url IS 'URL do webhook personalizada (opcional)';
COMMENT ON COLUMN public.settings.mercado_pago_enabled IS 'Se o Mercado Pago está habilitado para este usuário';

-- Índice para configurações do Mercado Pago
CREATE INDEX IF NOT EXISTS idx_settings_mercado_pago_enabled ON public.settings(mercado_pago_enabled);

UPDATE public.settings 
SET mercado_pago_enabled = false 
WHERE mercado_pago_enabled IS NULL;

-- 6. CRIAR POLÍTICAS RLS (ROW LEVEL SECURITY) PARA A TABELA PAYMENTS
-- =====================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver e criar novamente
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments for their appointments" ON public.payments;
DROP POLICY IF EXISTS "Users can update payments for their appointments" ON public.payments;

-- Política para permitir que usuários vejam apenas seus próprios pagamentos
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE user_id = auth.uid()
        )
    );

-- Política para permitir que usuários insiram pagamentos para seus agendamentos
CREATE POLICY "Users can insert payments for their appointments" ON public.payments
    FOR INSERT WITH CHECK (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE user_id = auth.uid()
        )
    );

-- Política para permitir que usuários atualizem pagamentos de seus agendamentos
CREATE POLICY "Users can update payments for their appointments" ON public.payments
    FOR UPDATE USING (
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Execute esta query para verificar se tudo foi criado corretamente:

SELECT 
    'payments' as table_name,
    COUNT(*) as row_count
FROM public.payments
UNION ALL
SELECT 
    'appointments_with_payment_status' as table_name,
    COUNT(*) as row_count
FROM public.appointments 
WHERE payment_status IS NOT NULL
UNION ALL
SELECT 
    'settings_with_payment_policy' as table_name,
    COUNT(*) as row_count
FROM public.settings 
WHERE payment_policy IS NOT NULL;
