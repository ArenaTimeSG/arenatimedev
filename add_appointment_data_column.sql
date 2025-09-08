-- Adicionar coluna appointment_data na tabela payments
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adicionar coluna para armazenar dados do agendamento
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS appointment_data TEXT;

-- Adicionar comentário na nova coluna
COMMENT ON COLUMN public.payments.appointment_data IS 'Dados do agendamento em JSON para criação pelo webhook quando appointment_id é null';

-- Criar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_payments_appointment_data ON public.payments(appointment_data);

SELECT 'Coluna appointment_data adicionada com sucesso!' as resultado;
