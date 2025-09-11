-- Script para testar a atualização de status para 'pago'

-- 1. Primeiro, vamos ver um agendamento específico que deveria ser pago
SELECT 
    id,
    date,
    status,
    valor_total,
    client_id
FROM public.appointments 
WHERE status = 'a_cobrar'
LIMIT 1;

-- 2. Vamos tentar atualizar um agendamento específico para 'pago'
-- (Substitua o ID pelo ID real do agendamento que você quer testar)
UPDATE public.appointments 
SET status = 'pago'
WHERE id = (
    SELECT id 
    FROM public.appointments 
    WHERE status = 'a_cobrar' 
    LIMIT 1
);

-- 3. Verificar se a atualização funcionou
SELECT 
    'Após atualização' as momento,
    status,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM public.appointments 
GROUP BY status
ORDER BY status;
