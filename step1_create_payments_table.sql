-- PASSO 1: Criar apenas a tabela payments
-- Execute este script primeiro no SQL Editor do Supabase

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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_mercado_pago_id ON public.payments(mercado_pago_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Tabela payments criada com sucesso!' as resultado;
