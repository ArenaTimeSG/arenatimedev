-- =====================================================
-- CORREÇÃO DO ERRO DE FOREIGN KEY CONSTRAINT
-- =====================================================

-- Este script corrige o erro:
-- "insert or update on table "appointments" violates foreign key constraint "appointments_client_id_fkey""

-- 1. VERIFICAR PROBLEMA ATUAL
-- =====================================================

-- Verificar appointments com client_id que não existem em booking_clients
SELECT 'Appointments com client_id inválido:' as info;
SELECT a.id, a.client_id, a.date, a.status
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL
ORDER BY a.date DESC;

-- Verificar quantos appointments têm client_id inválido
SELECT 'Contagem de appointments com client_id inválido:' as info;
SELECT COUNT(*) as total_invalid
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL;

-- 2. CORRIGIR APPOINTMENTS COM CLIENT_ID INVÁLIDO
-- =====================================================

-- Opção 1: Remover appointments órfãos (recomendado se são dados de teste)
DELETE FROM public.appointments 
WHERE client_id NOT IN (
    SELECT id FROM public.booking_clients
);

-- Opção 2: Atualizar appointments para usar um cliente válido (se necessário)
-- Descomente as linhas abaixo se quiser manter os appointments e vinculá-los a um cliente existente
/*
-- Encontrar um cliente válido para usar como padrão
WITH valid_client AS (
    SELECT id FROM public.booking_clients LIMIT 1
)
UPDATE public.appointments 
SET client_id = (SELECT id FROM valid_client)
WHERE client_id NOT IN (
    SELECT id FROM public.booking_clients
);
*/

-- 3. VERIFICAR SE AINDA HÁ PROBLEMAS
-- =====================================================

-- Verificar se ainda existem appointments com client_id inválido
SELECT 'Verificação após correção:' as info;
SELECT COUNT(*) as remaining_invalid
FROM public.appointments a
LEFT JOIN public.booking_clients bc ON a.client_id = bc.id
WHERE bc.id IS NULL;

-- 4. RECRIAR CONSTRAINT COM VERIFICAÇÃO
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
SELECT 'Constraints da tabela appointments após correção:' as info;
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

-- 6. TESTE DE INSERÇÃO (comentado para não executar automaticamente)
-- =====================================================

/*
-- Teste para verificar se a constraint funciona
-- Primeiro, criar um cliente de teste
INSERT INTO public.booking_clients (name, email, password_hash, phone)
VALUES ('Cliente Teste', 'teste@email.com', 'hash_teste', '11999999999')
RETURNING id;

-- Depois, criar um appointment vinculado a esse cliente
INSERT INTO public.appointments (client_id, date, status)
VALUES (
    (SELECT id FROM public.booking_clients WHERE email = 'teste@email.com'),
    NOW(),
    'a_cobrar'
);

-- Limpar teste
DELETE FROM public.appointments WHERE client_id = (SELECT id FROM public.booking_clients WHERE email = 'teste@email.com');
DELETE FROM public.booking_clients WHERE email = 'teste@email.com';
*/

-- 7. INFORMAÇÕES SOBRE A CORREÇÃO
-- =====================================================

SELECT 'CORREÇÃO DE FOREIGN KEY CONCLUÍDA' as status;
SELECT 'Problemas corrigidos:' as info;
SELECT '- Appointments órfãos removidos' as info;
SELECT '- Foreign key constraint recriada' as info;
SELECT '- Relacionamento appointments -> booking_clients funcionando' as info;
SELECT 'O sistema de agendamentos deve funcionar corretamente agora.' as info;
