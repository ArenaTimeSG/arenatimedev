-- PASSO 2: Adicionar coluna payment_status na tabela appointments
-- Execute este script após o PASSO 1

-- Adicionar coluna payment_status na tabela appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'not_required' 
CHECK (payment_status IN ('not_required', 'pending', 'failed'));

-- Adicionar comentário na nova coluna
COMMENT ON COLUMN public.appointments.payment_status IS 'Status do pagamento do agendamento: not_required, pending, failed. Quando pago, o status principal vira "pago"';

-- Criar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);

-- Atualizar agendamentos existentes
UPDATE public.appointments 
SET payment_status = 'not_required' 
WHERE payment_status IS NULL;

SELECT 'Coluna payment_status adicionada com sucesso!' as resultado;
