-- Script para corrigir a tabela payments existente
-- Execute este script no SQL Editor do Supabase

-- Verificar se a tabela payments existe e adicionar colunas que faltam
DO $$
BEGIN
    -- Adicionar coluna currency se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'currency') THEN
        ALTER TABLE public.payments ADD COLUMN currency VARCHAR(3) DEFAULT 'BRL';
    END IF;
    
    -- Adicionar coluna amount se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'amount') THEN
        ALTER TABLE public.payments ADD COLUMN amount DECIMAL(10,2);
    END IF;
    
    -- Adicionar coluna status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'status') THEN
        ALTER TABLE public.payments ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;
    
    -- Adicionar coluna payment_method se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'payment_method') THEN
        ALTER TABLE public.payments ADD COLUMN payment_method VARCHAR(50);
    END IF;
    
    -- Adicionar coluna mercado_pago_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'mercado_pago_id') THEN
        ALTER TABLE public.payments ADD COLUMN mercado_pago_id VARCHAR(100);
    END IF;
    
    -- Adicionar coluna mercado_pago_status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'mercado_pago_status') THEN
        ALTER TABLE public.payments ADD COLUMN mercado_pago_status VARCHAR(50);
    END IF;
    
    -- Adicionar coluna mercado_pago_payment_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'mercado_pago_payment_id') THEN
        ALTER TABLE public.payments ADD COLUMN mercado_pago_payment_id VARCHAR(100);
    END IF;
    
    -- Adicionar coluna created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'created_at') THEN
        ALTER TABLE public.payments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'updated_at') THEN
        ALTER TABLE public.payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Adicionar coluna appointment_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'appointment_id') THEN
        ALTER TABLE public.payments ADD COLUMN appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Adicionar constraints se não existirem
DO $$
BEGIN
    -- Adicionar constraint para status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'payments_status_check') THEN
        ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
    END IF;
    
    -- Adicionar constraint para currency se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'payments_currency_check') THEN
        ALTER TABLE public.payments ADD CONSTRAINT payments_currency_check 
        CHECK (currency = 'BRL');
    END IF;
END $$;

-- Adicionar comentários
COMMENT ON TABLE public.payments IS 'Tabela para armazenar informações de pagamentos dos agendamentos';
COMMENT ON COLUMN public.payments.appointment_id IS 'ID do agendamento relacionado';
COMMENT ON COLUMN public.payments.amount IS 'Valor do pagamento em reais';
COMMENT ON COLUMN public.payments.currency IS 'Moeda do pagamento (padrão: BRL)';
COMMENT ON COLUMN public.payments.status IS 'Status do pagamento: pending, approved, rejected, cancelled';
COMMENT ON COLUMN public.payments.payment_method IS 'Método de pagamento usado';
COMMENT ON COLUMN public.payments.mercado_pago_id IS 'ID da preferência no Mercado Pago';
COMMENT ON COLUMN public.payments.mercado_pago_status IS 'Status retornado pelo Mercado Pago';
COMMENT ON COLUMN public.payments.mercado_pago_payment_id IS 'ID do pagamento no Mercado Pago';

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_mercado_pago_id ON public.payments(mercado_pago_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Criar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger se existir e criar novamente
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Tabela payments corrigida com sucesso!' as resultado;
