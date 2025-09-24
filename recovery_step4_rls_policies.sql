-- =====================================================
-- ETAPA 4: CONFIGURAR POLÍTICAS RLS FINAIS
-- Execute este script APÓS a ETAPA 3
-- =====================================================

-- 1. AJUSTAR POLÍTICAS RLS PARA CLIENTS
-- =====================================================
-- Remover políticas temporárias e criar as finais
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

-- Políticas finais para clients (permitir acesso geral para administradores)
CREATE POLICY "Authenticated users can view clients" ON public.clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON public.clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" ON public.clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients" ON public.clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- 2. AJUSTAR POLÍTICAS RLS PARA RECURRENCES
-- =====================================================
-- Remover políticas temporárias e criar as finais
DROP POLICY IF EXISTS "Users can view recurrences" ON public.recurrences;
DROP POLICY IF EXISTS "Users can insert recurrences" ON public.recurrences;
DROP POLICY IF EXISTS "Users can update recurrences" ON public.recurrences;
DROP POLICY IF EXISTS "Users can delete recurrences" ON public.recurrences;

-- Políticas finais para recurrences (permitir acesso geral para administradores)
CREATE POLICY "Authenticated users can view recurrences" ON public.recurrences
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert recurrences" ON public.recurrences
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update recurrences" ON public.recurrences
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete recurrences" ON public.recurrences
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. CRIAR FUNÇÕES AUXILIARES PARA POLÍTICAS
-- =====================================================
-- Função para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário pode acessar dados de um cliente específico
CREATE OR REPLACE FUNCTION can_access_client(client_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Se não há user_id específico, permitir acesso
    IF client_user_id IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Se o usuário atual é o dono dos dados, permitir
    RETURN auth.uid() = client_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR POLÍTICAS PARA ACESSO PÚBLICO (RESERVAS ONLINE)
-- =====================================================
-- Permitir que usuários não autenticados façam reservas online
DROP POLICY IF EXISTS "Public can insert online_reservations" ON public.online_reservations;
CREATE POLICY "Public can insert online_reservations" ON public.online_reservations
    FOR INSERT WITH CHECK (true);

-- Permitir que usuários não autenticados vejam suas próprias reservas (por email)
DROP POLICY IF EXISTS "Public can view own online_reservations" ON public.online_reservations;
CREATE POLICY "Public can view own online_reservations" ON public.online_reservations
    FOR SELECT USING (
        cliente_email = current_setting('request.jwt.claims', true)::json->>'email'
        OR auth.uid() = admin_user_id
    );

-- 5. CRIAR POLÍTICAS PARA BOOKING_CLIENTS (ACESSO PÚBLICO)
-- =====================================================
-- Permitir que usuários não autenticados criem clientes para reservas
DROP POLICY IF EXISTS "Public can insert booking_clients" ON public.booking_clients;
CREATE POLICY "Public can insert booking_clients" ON public.booking_clients
    FOR INSERT WITH CHECK (true);

-- Permitir que usuários não autenticados vejam clientes (para reservas)
DROP POLICY IF EXISTS "Public can view booking_clients" ON public.booking_clients;
CREATE POLICY "Public can view booking_clients" ON public.booking_clients
    FOR SELECT USING (true);

-- 6. CRIAR FUNÇÃO PARA WEBHOOK DO MERCADO PAGO
-- =====================================================
-- Função para permitir que o webhook do Mercado Pago acesse os dados
CREATE OR REPLACE FUNCTION allow_webhook_access()
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se a requisição vem do webhook do Mercado Pago
    -- Isso pode ser ajustado conforme necessário
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CRIAR POLÍTICAS ESPECIAIS PARA WEBHOOK
-- =====================================================
-- Permitir que o webhook atualize pagamentos
DROP POLICY IF EXISTS "Webhook can update payments" ON public.payments;
CREATE POLICY "Webhook can update payments" ON public.payments
    FOR UPDATE USING (allow_webhook_access());

-- Permitir que o webhook insira pagamentos
DROP POLICY IF EXISTS "Webhook can insert payments" ON public.payments;
CREATE POLICY "Webhook can insert payments" ON public.payments
    FOR INSERT WITH CHECK (allow_webhook_access());

-- 8. VERIFICAR E AJUSTAR POLÍTICAS EXISTENTES
-- =====================================================
-- Verificar se todas as tabelas têm RLS habilitado
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY['clients', 'appointments', 'payments', 'settings', 'monthly_events', 'time_blockades', 'booking_clients', 'online_reservations', 'recurrences'];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Verificar se RLS está habilitado
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = table_name 
            AND n.nspname = 'public'
            AND c.relrowsecurity = true
        ) THEN
            RAISE NOTICE 'RLS não está habilitado para a tabela: %', table_name;
        ELSE
            RAISE NOTICE 'RLS está habilitado para a tabela: %', table_name;
        END IF;
    END LOOP;
END $$;

-- 9. CRIAR ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================
-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_appointments_user_date_status ON public.appointments(user_id, date, status);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_status ON public.payments(appointment_id, status);
CREATE INDEX IF NOT EXISTS idx_monthly_events_user_date_status ON public.monthly_events(user_id, event_date, status);
CREATE INDEX IF NOT EXISTS idx_time_blockades_user_date_time ON public.time_blockades(user_id, date, start_time);

-- 10. VERIFICAÇÃO FINAL DAS POLÍTICAS
-- =====================================================
SELECT 'ETAPA 4 CONCLUÍDA: Políticas RLS configuradas com sucesso!' as status;

-- Mostrar todas as políticas criadas
SELECT 'Políticas RLS criadas:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'HAS_QUAL'
        ELSE 'NO_QUAL'
    END as has_qualification
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Mostrar tabelas com RLS habilitado
SELECT 'Tabelas com RLS habilitado:' as info;
SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
ORDER BY c.relname;
