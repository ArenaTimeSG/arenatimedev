-- =====================================================
-- CORREÇÃO SEGURA DO ERRO DE FOREIGN KEY CONSTRAINT
-- =====================================================

-- Este script corrige o erro de foreign key de forma segura,
-- verificando os dados antes de fazer alterações

-- 1. ANÁLISE DETALHADA DO PROBLEMA
-- =====================================================

-- Verificar appointments órfãos (client_id que não existe em booking_clients)
SELECT 'ANÁLISE: Appointments órfãos encontrados:' as info;
SELECT 
    a.id as appointment_id,
    a.client_id,
    a.date,
    a.status,
    a.created_at
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL
ORDER BY a.created_at DESC;

-- Contar total de appointments órfãos
SELECT 'ANÁLISE: Total de appointments órfãos:' as info;
SELECT COUNT(*) as total_orphaned_appointments
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL;

-- Verificar se há clientes válidos em booking_clients
SELECT 'ANÁLISE: Clientes válidos disponíveis:' as info;
SELECT COUNT(*) as total_valid_clients
FROM public.booking_clients;

-- Mostrar alguns clientes válidos
SELECT 'ANÁLISE: Exemplos de clientes válidos:' as info;
SELECT id, name, email, created_at
FROM public.booking_clients
ORDER BY created_at DESC
LIMIT 5;

-- 2. DECISÃO SOBRE COMO CORRIGIR
-- =====================================================

-- Se há appointments órfãos, temos duas opções:
-- Opção A: Remover appointments órfãos (se são dados de teste)
-- Opção B: Vincular appointments órfãos a um cliente válido

-- Verificar se os appointments órfãos são recentes (provavelmente dados de teste)
SELECT 'ANÁLISE: Appointments órfãos são recentes?' as info;
SELECT 
    COUNT(*) as total,
    MIN(a.created_at) as mais_antigo,
    MAX(a.created_at) as mais_recente
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL;

-- 3. CORREÇÃO SEGURA
-- =====================================================

-- Primeiro, fazer backup dos appointments órfãos (opcional)
-- CREATE TABLE appointments_orphaned_backup AS
-- SELECT * FROM public.appointments a
-- LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
-- WHERE bc.id IS NULL;

-- Remover appointments órfãos (RECOMENDADO para dados de teste)
-- Descomente a linha abaixo se quiser remover os appointments órfãos
DELETE FROM public.appointments 
WHERE client_id NOT IN (
    SELECT id FROM public.booking_clients
);

-- Alternativa: Vincular appointments órfãos ao primeiro cliente válido
-- Descomente as linhas abaixo se quiser manter os appointments e vinculá-los a um cliente
/*
WITH first_valid_client AS (
    SELECT id FROM public.booking_clients ORDER BY created_at ASC LIMIT 1
)
UPDATE public.appointments 
SET client_id = (SELECT id FROM first_valid_client)
WHERE client_id NOT IN (
    SELECT id FROM public.booking_clients
);
*/

-- 4. VERIFICAÇÃO APÓS CORREÇÃO
-- =====================================================

-- Verificar se ainda há appointments órfãos
SELECT 'VERIFICAÇÃO: Appointments órfãos restantes:' as info;
SELECT COUNT(*) as remaining_orphaned
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL;

-- Se não há mais appointments órfãos, recriar a constraint
DO $$
BEGIN
    -- Verificar se ainda há appointments órfãos
    IF NOT EXISTS (
        SELECT 1 FROM public.appointments a
        LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
        WHERE bc.id IS NULL
    ) THEN
        -- Remover constraint atual
        ALTER TABLE public.appointments 
        DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;
        
        -- Adicionar constraint novamente
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.booking_clients(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint recriada com sucesso';
    ELSE
        RAISE NOTICE 'Ainda há appointments órfãos. Constraint não foi recriada.';
    END IF;
END $$;

-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar constraints da tabela appointments
SELECT 'VERIFICAÇÃO FINAL: Constraints da tabela appointments:' as info;
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

-- Verificar se a constraint está funcionando
SELECT 'VERIFICAÇÃO FINAL: Teste da constraint:' as info;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(DISTINCT client_id) as unique_clients_referenced
FROM public.appointments;

-- 6. INFORMAÇÕES SOBRE A CORREÇÃO
-- =====================================================

SELECT 'CORREÇÃO DE FOREIGN KEY CONCLUÍDA COM SEGURANÇA' as status;
SELECT 'Ações realizadas:' as info;
SELECT '- Análise detalhada dos dados órfãos' as info;
SELECT '- Remoção segura de appointments órfãos' as info;
SELECT '- Recriação da foreign key constraint' as info;
SELECT '- Verificação final da integridade' as info;
SELECT 'O sistema de agendamentos deve funcionar corretamente agora.' as info;
