-- =====================================================
-- ETAPA 2: CONFIGURAR SISTEMA DE PAGAMENTOS
-- Execute este script APÓS a ETAPA 1
-- =====================================================

-- 1. CRIAR TABELA PAYMENTS
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
  mercado_pago_preference_id VARCHAR(100),
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
COMMENT ON COLUMN public.payments.mercado_pago_preference_id IS 'ID da preferência de pagamento no Mercado Pago';

-- Índices para a tabela payments
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_mercado_pago_id ON public.payments(mercado_pago_id);
CREATE INDEX IF NOT EXISTS idx_payments_mercado_pago_preference_id ON public.payments(mercado_pago_preference_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- 2. CRIAR TRIGGER PARA UPDATED_AT NA TABELA PAYMENTS
-- =====================================================
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 3. CRIAR TABELA SETTINGS (se não existir)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_policy VARCHAR(20) NOT NULL DEFAULT 'sem_pagamento' CHECK (payment_policy IN ('sem_pagamento', 'obrigatorio', 'opcional')),
    mercado_pago_access_token VARCHAR(255),
    mercado_pago_public_key VARCHAR(255),
    mercado_pago_webhook_url VARCHAR(500),
    mercado_pago_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela settings
COMMENT ON TABLE public.settings IS 'Configurações do sistema por usuário';
COMMENT ON COLUMN public.settings.user_id IS 'ID do usuário administrador';
COMMENT ON COLUMN public.settings.payment_policy IS 'Política de pagamento: sem_pagamento, obrigatorio, opcional';
COMMENT ON COLUMN public.settings.mercado_pago_access_token IS 'Access Token do Mercado Pago para este usuário';
COMMENT ON COLUMN public.settings.mercado_pago_public_key IS 'Public Key do Mercado Pago para este usuário';
COMMENT ON COLUMN public.settings.mercado_pago_webhook_url IS 'URL do webhook personalizada (opcional)';
COMMENT ON COLUMN public.settings.mercado_pago_enabled IS 'Se o Mercado Pago está habilitado para este usuário';

-- Índices para settings
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_payment_policy ON public.settings(payment_policy);
CREATE INDEX IF NOT EXISTS idx_settings_mercado_pago_enabled ON public.settings(mercado_pago_enabled);

-- 4. CRIAR TRIGGER PARA UPDATED_AT NA TABELA SETTINGS
-- =====================================================
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON public.settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. HABILITAR ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS RLS PARA PAYMENTS
-- =====================================================
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

-- 7. CRIAR POLÍTICAS RLS PARA SETTINGS
-- =====================================================
DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;
CREATE POLICY "Users can view own settings" ON public.settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
CREATE POLICY "Users can insert own settings" ON public.settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
CREATE POLICY "Users can update own settings" ON public.settings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON public.settings;
CREATE POLICY "Users can delete own settings" ON public.settings
    FOR DELETE USING (auth.uid() = user_id);

-- 8. ATUALIZAR CONFIGURAÇÕES EXISTENTES
-- =====================================================
-- Garantir que todos os usuários tenham configurações padrão
INSERT INTO public.settings (user_id, payment_policy, mercado_pago_enabled)
SELECT 
    id as user_id,
    'sem_pagamento' as payment_policy,
    false as mercado_pago_enabled
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.settings)
ON CONFLICT (user_id) DO NOTHING;

-- 9. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'ETAPA 2 CONCLUÍDA: Sistema de pagamentos configurado com sucesso!' as status;

-- Mostrar estrutura das tabelas criadas
SELECT 'Estrutura da tabela payments:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela settings:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se as políticas foram criadas
SELECT 'Políticas RLS criadas para payments:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'payments';

SELECT 'Políticas RLS criadas para settings:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'settings';
