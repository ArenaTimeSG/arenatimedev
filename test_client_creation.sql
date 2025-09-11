-- Script para testar criação de clientes e verificar constraints

-- Verificar estrutura da tabela booking_clients
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_clients' 
ORDER BY ordinal_position;

-- Verificar constraints existentes
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'booking_clients'
ORDER BY tc.constraint_name;

-- Testar inserção de cliente (substitua os valores pelos seus)
-- INSERT INTO booking_clients (name, email, phone, password_hash, user_id)
-- VALUES ('Teste Cliente', 'teste@exemplo.com', '11999999999', 'temp_hash', 'SEU_USER_ID_AQUI');

-- Verificar se há clientes duplicados por email
SELECT email, user_id, COUNT(*) as count
FROM booking_clients 
GROUP BY email, user_id 
HAVING COUNT(*) > 1;
