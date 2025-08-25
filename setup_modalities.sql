-- =====================================================
-- SETUP MODALIDADES - ARENATIME
-- =====================================================
-- Execute este arquivo no SQL Editor do Supabase
-- Data: 2025-01-22
-- =====================================================

-- 1. Criar tabela de modalidades
CREATE TABLE IF NOT EXISTS public.modalities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Garantir nomes únicos por usuário
    UNIQUE(user_id, name)
);

-- 2. Habilitar Row Level Security
ALTER TABLE public.modalities ENABLE ROW LEVEL SECURITY;

-- 3. Criar política RLS para modalidades
DROP POLICY IF EXISTS "Users can manage their own modalities" ON public.modalities;
CREATE POLICY "Users can manage their own modalities" ON public.modalities
    FOR ALL USING (auth.uid() = user_id);

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_modalities_user_id ON public.modalities(user_id);

-- 5. Adicionar comentário à tabela
COMMENT ON TABLE public.modalities IS 'Tabela para armazenar modalidades esportivas definidas pelos usuários';

-- 6. Adicionar colunas à tabela appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS modality_id UUID REFERENCES public.modalities(id) ON DELETE SET NULL;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 7. Criar índice para modality_id
CREATE INDEX IF NOT EXISTS idx_appointments_modality_id ON public.appointments(modality_id);

-- 8. Adicionar comentários às colunas
COMMENT ON COLUMN public.appointments.modality_id IS 'Chave estrangeira para a tabela modalities';
COMMENT ON COLUMN public.appointments.valor_total IS 'Valor total do agendamento (herdado do valor da modalidade)';

-- 9. Remover modalidades fixas das configurações existentes
UPDATE public.settings 
SET 
  modalities_enabled = '{}'::jsonb,
  modalities_colors = '{}'::jsonb
WHERE 
  modalities_enabled IS NOT NULL 
  OR modalities_colors IS NOT NULL;

-- 10. Verificar se tudo foi criado corretamente
DO $$
BEGIN
  -- Verificar se a tabela modalities existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'modalities'
  ) THEN
    RAISE EXCEPTION 'Tabela modalities não foi criada com sucesso';
  END IF;
  
  -- Verificar se as colunas foram adicionadas à appointments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'modality_id'
  ) THEN
    RAISE EXCEPTION 'Coluna modality_id não foi adicionada com sucesso';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'valor_total'
  ) THEN
    RAISE EXCEPTION 'Coluna valor_total não foi adicionada com sucesso';
  END IF;
  
  RAISE NOTICE '✅ Setup concluído com sucesso! Todas as tabelas e colunas foram criadas.';
END $$;

-- =====================================================
-- FIM DO SETUP
-- =====================================================

