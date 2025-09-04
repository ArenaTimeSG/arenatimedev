-- Script para verificar a política de pagamento no banco
-- Execute este script no SQL Editor do Supabase

-- Verificar se a coluna payment_policy existe
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' AND column_name = 'payment_policy';

-- Verificar os valores atuais de payment_policy
SELECT 
    user_id,
    payment_policy,
    mercado_pago_enabled,
    created_at,
    updated_at
FROM public.settings 
ORDER BY updated_at DESC;

-- Verificar se há configurações para o usuário específico
SELECT 
    user_id,
    payment_policy,
    online_enabled,
    mercado_pago_enabled
FROM public.settings 
WHERE user_id = '49014464-6ed9-4fee-af45-06105f31698b';
