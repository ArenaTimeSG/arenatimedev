-- Remover a constraint de email único global
ALTER TABLE booking_clients DROP CONSTRAINT IF EXISTS booking_clients_email_key;

-- Criar uma constraint composta que permite emails duplicados entre diferentes user_id
-- mas não permite emails duplicados para o mesmo user_id
ALTER TABLE booking_clients ADD CONSTRAINT booking_clients_email_user_unique 
UNIQUE (email, user_id);

-- Comentário explicativo
COMMENT ON CONSTRAINT booking_clients_email_user_unique ON booking_clients 
IS 'Permite emails duplicados entre diferentes administradores, mas não permite emails duplicados para o mesmo administrador';
