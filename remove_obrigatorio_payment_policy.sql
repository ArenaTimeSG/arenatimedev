-- Script para remover a política de pagamento obrigatório
-- Atualiza todas as configurações que usam 'obrigatorio' para 'opcional'

-- Atualizar configurações existentes
UPDATE public.settings 
SET payment_policy = 'opcional'
WHERE payment_policy = 'obrigatorio';

-- Verificar se há configurações que ainda usam 'obrigatorio'
SELECT 
    id,
    payment_policy,
    created_at
FROM public.settings 
WHERE payment_policy = 'obrigatorio';

-- Mostrar quantas configurações foram atualizadas
SELECT 
    payment_policy,
    COUNT(*) as total
FROM public.settings 
GROUP BY payment_policy
ORDER BY payment_policy;
