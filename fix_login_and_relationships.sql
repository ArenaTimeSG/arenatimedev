-- =====================================================
-- CORREÇÃO DOS PROBLEMAS DE LOGIN E RELACIONAMENTOS
-- =====================================================

-- Este script corrige os problemas identificados:
-- 1. Múltiplos registros com o mesmo email
-- 2. Relacionamento entre appointments e booking_clients
-- 3. Políticas RLS adequadas

-- 1. VERIFICAR PROBLEMAS ATUAIS
-- =====================================================

-- Verificar múltiplos registros com o mesmo email
SELECT 'Clientes com emails duplicados:' as info;
SELECT email, COUNT(*) as quantidade
FROM public.booking_clients 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- Verificar estrutura da tabela appointments
SELECT 'Constraints da tabela appointments:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'appointments'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- 2. CORRIGIR MÚLTIPLOS REGISTROS COM MESMO EMAIL
-- =====================================================

-- Remover registros duplicados, mantendo apenas o mais recente
WITH duplicates AS (
    SELECT id, email, created_at,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM public.booking_clients 
    WHERE email IS NOT NULL
)
DELETE FROM public.booking_clients 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Adicionar constraint de email único
ALTER TABLE public.booking_clients 
ADD CONSTRAINT booking_clients_email_unique UNIQUE (email);

-- 3. CORRIGIR RELACIONAMENTO ENTRE APPOINTMENTS E BOOKING_CLIENTS
-- =====================================================

-- Remover constraint antiga que referencia clients (se existir)
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;

-- Adicionar constraint correta que referencia booking_clients
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.booking_clients(id) ON DELETE CASCADE;

-- 4. CORRIGIR POLÍTICAS RLS PARA BOOKING_CLIENTS
-- =====================================================

-- Remover todas as políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'booking_clients' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.booking_clients', policy_record.policyname);
        RAISE NOTICE 'Política removida: %', policy_record.policyname;
    END LOOP;
END $$;

-- Criar políticas RLS adequadas
CREATE POLICY "Public can view booking_clients" ON public.booking_clients
    FOR SELECT USING (true);

CREATE POLICY "Public can insert booking_clients" ON public.booking_clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update booking_clients" ON public.booking_clients
    FOR UPDATE USING (true);

CREATE POLICY "Public can delete booking_clients" ON public.booking_clients
    FOR DELETE USING (true);

-- 5. CORRIGIR POLÍTICAS RLS PARA APPOINTMENTS
-- =====================================================

-- Remover políticas antigas de appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can delete appointments" ON public.appointments;

-- Criar políticas RLS para appointments
CREATE POLICY "Public can view appointments" ON public.appointments
    FOR SELECT USING (true);

CREATE POLICY "Public can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update appointments" ON public.appointments
    FOR UPDATE USING (true);

CREATE POLICY "Public can delete appointments" ON public.appointments
    FOR DELETE USING (true);

-- 6. GARANTIR QUE TODAS AS COLUNAS NECESSÁRIAS EXISTEM
-- =====================================================

-- Para booking_clients
ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT 'temp_hash';

ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.booking_clients 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Para appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS modality_id UUID REFERENCES public.modalities(id) ON DELETE SET NULL;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS booking_source VARCHAR(20) DEFAULT 'manual' CHECK (booking_source IN ('manual', 'online'));

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Para booking_clients
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON public.booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_booking_clients_phone ON public.booking_clients(phone);
CREATE INDEX IF NOT EXISTS idx_booking_clients_user_id ON public.booking_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_clients_admin_user_id ON public.booking_clients(admin_user_id);

-- Para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_modality_id ON public.appointments(modality_id);

-- 8. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se não há mais emails duplicados
SELECT 'Verificação de emails duplicados:' as info;
SELECT email, COUNT(*) as quantidade
FROM public.booking_clients 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- Verificar constraints finais
SELECT 'Constraints finais da tabela appointments:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'appointments'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- Verificar políticas RLS finais
SELECT 'Políticas RLS finais para booking_clients:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'booking_clients';

SELECT 'Políticas RLS finais para appointments:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'appointments';

-- 9. INFORMAÇÕES SOBRE AS CORREÇÕES
-- =====================================================

SELECT 'CORREÇÕES CONCLUÍDAS' as status;
SELECT 'Problemas corrigidos:' as info;
SELECT '- Emails duplicados removidos' as info;
SELECT '- Constraint de email único adicionada' as info;
SELECT '- Relacionamento appointments -> booking_clients corrigido' as info;
SELECT '- Políticas RLS ajustadas para ambas as tabelas' as info;
SELECT '- Índices criados para melhor performance' as info;
SELECT 'O sistema de login e agendamentos deve funcionar corretamente agora.' as info;
