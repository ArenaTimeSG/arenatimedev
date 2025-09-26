-- Adicionar colunas que estão faltando na tabela appointments para compatibilidade com CSV
-- =====================================================

-- Adicionar coluna admin_user_id (se não existir)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS admin_user_id UUID;

-- Adicionar coluna name (se não existir)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Adicionar coluna email (se não existir)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Comentários das novas colunas
COMMENT ON COLUMN public.appointments.admin_user_id IS 'ID do usuário administrador (compatibilidade com dados antigos)';
COMMENT ON COLUMN public.appointments.name IS 'Nome do cliente (compatibilidade com dados antigos)';
COMMENT ON COLUMN public.appointments.email IS 'Email do cliente (compatibilidade com dados antigos)';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
