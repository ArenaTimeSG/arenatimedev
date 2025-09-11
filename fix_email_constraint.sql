-- Corrigir constraint de email para permitir emails duplicados entre diferentes usuários
-- mas manter unicidade por usuário

-- Primeiro, remover a constraint global de email único
ALTER TABLE booking_clients DROP CONSTRAINT IF EXISTS booking_clients_email_key;

-- Adicionar constraint composta (email, user_id) para garantir unicidade por usuário
ALTER TABLE booking_clients ADD CONSTRAINT booking_clients_email_user_id_key UNIQUE (email, user_id);