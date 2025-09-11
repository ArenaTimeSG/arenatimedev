-- Corrigir clientes existentes que não têm user_id

-- 1. Verificar quantos clientes não têm user_id
SELECT 
    COUNT(*) as total_clients,
    COUNT(user_id) as clients_with_user_id,
    COUNT(*) - COUNT(user_id) as clients_without_user_id
FROM booking_clients;

-- 2. Ver clientes sem user_id
SELECT id, name, email, created_at
FROM booking_clients
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- 3. ATENÇÃO: Descomente as linhas abaixo para corrigir os clientes existentes
-- Você precisa definir qual user_id usar para os clientes existentes

-- Opção 1: Atribuir todos os clientes sem user_id para um usuário específico
-- Substitua 'SEU_USER_ID_AQUI' pelo ID do usuário que deve receber os clientes
-- UPDATE booking_clients 
-- SET user_id = 'SEU_USER_ID_AQUI'
-- WHERE user_id IS NULL;

-- Opção 2: Se você quiser deletar os clientes sem user_id (CUIDADO!)
-- DELETE FROM booking_clients WHERE user_id IS NULL;

-- 4. Verificar se a correção funcionou
-- SELECT COUNT(*) as clients_with_user_id FROM booking_clients WHERE user_id IS NOT NULL;
