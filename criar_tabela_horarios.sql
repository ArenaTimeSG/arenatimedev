-- =====================================================
-- Criar tabela de horários e ajustar estrutura
-- =====================================================

-- 1. Criar tabela de horários disponíveis
CREATE TABLE IF NOT EXISTS public.horarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hora TIME NOT NULL UNIQUE,
    descricao VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir horários padrão (08:00 às 18:00)
INSERT INTO public.horarios (hora, descricao) VALUES
    ('08:00', '08:00'),
    ('09:00', '09:00'),
    ('10:00', '10:00'),
    ('11:00', '11:00'),
    ('12:00', '12:00'),
    ('13:00', '13:00'),
    ('14:00', '14:00'),
    ('15:00', '15:00'),
    ('16:00', '16:00'),
    ('17:00', '17:00'),
    ('18:00', '18:00')
ON CONFLICT (hora) DO NOTHING;

-- 3. Adicionar campo hora separado na tabela appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS hora TIME;

-- 4. Atualizar campo hora baseado no campo date existente
UPDATE public.appointments 
SET hora = EXTRACT(TIME FROM date)
WHERE hora IS NULL;

-- 5. Adicionar constraint única para data + hora
ALTER TABLE public.appointments 
ADD CONSTRAINT IF NOT EXISTS unq_data_hora UNIQUE (date, hora);

-- 6. Verificar resultado
SELECT 
    'Horários criados' as tipo,
    COUNT(*) as total_horarios
FROM public.horarios;

SELECT 
    'Appointments com hora' as tipo,
    COUNT(*) as total_appointments,
    COUNT(hora) as com_hora
FROM public.appointments;
