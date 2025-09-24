-- =====================================================
-- CORREÇÃO SIMPLES DO ERRO DE FOREIGN KEY
-- =====================================================

-- Este script corrige o erro de foreign key de forma simples e direta

-- 1. VERIFICAR APPOINTMENTS ÓRFÃOS
-- =====================================================

-- Contar appointments órfãos
SELECT 'Appointments órfãos encontrados:' as info;
SELECT COUNT(*) as total_orphaned
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL;

-- Mostrar alguns appointments órfãos
SELECT 'Exemplos de appointments órfãos:' as info;
SELECT a.id, a.client_id, a.date, a.status, a.created_at
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL
ORDER BY a.created_at DESC
LIMIT 5;

-- 2. REMOVER APPOINTMENTS ÓRFÃOS
-- =====================================================

-- Remover appointments que referenciam client_id inexistentes
DELETE FROM public.appointments 
WHERE client_id NOT IN (
    SELECT id FROM public.booking_clients
);

-- 3. VERIFICAR SE A REMOÇÃO FUNCIONOU
-- =====================================================

-- Verificar se ainda há appointments órfãos
SELECT 'Appointments órfãos restantes:' as info;
SELECT COUNT(*) as remaining_orphaned
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL;

-- 4. RECRIAR FOREIGN KEY CONSTRAINT
-- =====================================================

-- Remover constraint atual
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;

-- Adicionar constraint novamente
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.booking_clients(id) ON DELETE CASCADE;

-- 5. VERIFICAR CONSTRAINT CRIADA
-- =====================================================

-- Verificar constraints da tabela appointments
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

-- 6. TESTE FINAL
-- =====================================================

-- Verificar integridade dos dados
SELECT 'Verificação final da integridade:' as info;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(DISTINCT client_id) as unique_clients_referenced
FROM public.appointments;

-- Verificar se todos os client_id em appointments existem em booking_clients
SELECT 'Verificação de integridade referencial:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCESSO: Todos os appointments têm client_id válido'
        ELSE 'ERRO: Ainda há appointments com client_id inválido'
    END as status
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL;

-- 7. INFORMAÇÕES SOBRE A CORREÇÃO
-- =====================================================

SELECT 'CORREÇÃO DE FOREIGN KEY CONCLUÍDA' as status;
SELECT 'Ações realizadas:' as info;
SELECT '- Appointments órfãos removidos' as info;
SELECT '- Foreign key constraint recriada' as info;
SELECT '- Integridade referencial verificada' as info;
SELECT 'O sistema de agendamentos deve funcionar corretamente agora.' as info;
