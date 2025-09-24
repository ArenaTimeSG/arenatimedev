-- Script para verificar e corrigir políticas RLS para cancelamento de agendamentos
-- O cliente precisa poder buscar e atualizar seus próprios agendamentos

-- 1. Verificar políticas RLS atuais da tabela appointments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'appointments'
ORDER BY policyname;

-- 2. Verificar se existe política para clientes cancelarem agendamentos
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'appointments'
AND policyname LIKE '%client%'
OR policyname LIKE '%cancel%';

-- 3. CRIAR política RLS para clientes cancelarem seus próprios agendamentos
-- Primeiro, remover política existente se houver
DROP POLICY IF EXISTS "Clients can cancel their own appointments" ON appointments;

-- Criar nova política para cancelamento
CREATE POLICY "Clients can cancel their own appointments" ON appointments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM booking_clients bc 
        WHERE bc.id = appointments.client_id 
        AND bc.email = auth.jwt() ->> 'email'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM booking_clients bc 
        WHERE bc.id = appointments.client_id 
        AND bc.email = auth.jwt() ->> 'email'
    )
);

-- 4. CRIAR política RLS para clientes visualizarem seus próprios agendamentos
DROP POLICY IF EXISTS "Clients can view their own appointments" ON appointments;

CREATE POLICY "Clients can view their own appointments" ON appointments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM booking_clients bc 
        WHERE bc.id = appointments.client_id 
        AND bc.email = auth.jwt() ->> 'email'
    )
);

-- 5. Verificar se as políticas foram criadas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'appointments'
AND policyname LIKE '%client%'
ORDER BY policyname;

-- 6. Testar se o cliente pode buscar seus agendamentos
-- (Execute este teste logado como cliente)
SELECT 
    a.id,
    a.client_id,
    a.user_id,
    a.date,
    a.status,
    a.modality,
    a.valor_total,
    a.booking_source,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE bc.email = 'PEDROGREEF06@GMAIL.COM'
ORDER BY a.created_at DESC
LIMIT 5;
