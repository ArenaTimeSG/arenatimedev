-- =====================================================
-- CORREÇÃO COMPLETA DA TABELA APPOINTMENTS
-- =====================================================

-- Verificar estrutura atual da tabela appointments
SELECT 'Estrutura atual da tabela appointments:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- ADICIONAR COLUNAS FALTANTES
-- =====================================================

-- Adicionar coluna booking_source se não existir
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS booking_source VARCHAR(20) DEFAULT 'manual' CHECK (booking_source IN ('manual', 'online'));

-- Adicionar coluna modality_id se não existir
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS modality_id UUID REFERENCES public.modalities(id) ON DELETE SET NULL;

-- Adicionar coluna is_cortesia se não existir
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS is_cortesia BOOLEAN DEFAULT false;

-- Adicionar coluna payment_status se não existir
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'failed', 'completed'));

-- Adicionar coluna recurrence_id se não existir
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS recurrence_id UUID REFERENCES public.recurrences(id) ON DELETE SET NULL;

-- =====================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_modality_id ON public.appointments(modality_id);
CREATE INDEX IF NOT EXISTS idx_appointments_recurrence_id ON public.appointments(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_source ON public.appointments(booking_source);

-- =====================================================
-- POLÍTICAS RLS PARA APPOINTMENTS
-- =====================================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
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

-- Política pública para visualização (necessária para agendamento online)
CREATE POLICY "Public can view appointments" ON public.appointments
    FOR SELECT USING (true);

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para appointments
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura final da tabela
SELECT 'Estrutura final da tabela appointments:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 'Políticas RLS da tabela appointments:' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'appointments' AND schemaname = 'public'
ORDER BY policyname;

-- Testar inserção de um agendamento de exemplo
INSERT INTO public.appointments (
    client_id, 
    date, 
    modality_id, 
    status, 
    booking_source, 
    is_cortesia, 
    payment_status, 
    user_id
)
SELECT 
    (SELECT id FROM public.booking_clients LIMIT 1),
    NOW() + INTERVAL '1 day',
    (SELECT id FROM public.modalities LIMIT 1),
    'agendado',
    'manual',
    false,
    'not_required',
    auth.uid()
WHERE EXISTS (SELECT 1 FROM public.booking_clients LIMIT 1)
AND EXISTS (SELECT 1 FROM public.modalities LIMIT 1)
ON CONFLICT DO NOTHING;

SELECT '🎉 TABELA APPOINTMENTS CORRIGIDA COM SUCESSO! Agora você pode criar agendamentos únicos e recorrentes!' as status_final;
