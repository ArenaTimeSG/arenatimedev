-- Script para aplicar a migração do campo payment_policy manualmente
-- Execute este script no seu banco de dados Supabase

-- Adicionar coluna payment_policy à tabela settings
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS payment_policy VARCHAR(20) NOT NULL DEFAULT 'sem_pagamento' 
CHECK (payment_policy IN ('sem_pagamento', 'obrigatorio', 'opcional'));

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.settings.payment_policy IS 'Política de pagamento: sem_pagamento, obrigatorio, opcional';

-- Criar índice para melhor performance (opcional)
CREATE INDEX IF NOT EXISTS idx_settings_payment_policy ON public.settings(payment_policy);

-- Atualizar configurações existentes para ter o valor padrão
UPDATE public.settings 
SET payment_policy = 'sem_pagamento' 
WHERE payment_policy IS NULL;

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' AND column_name = 'payment_policy';
