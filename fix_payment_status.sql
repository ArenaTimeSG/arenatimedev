-- Script para corrigir status de pagamento dos agendamentos
-- Altera todos os agendamentos com status 'pago' para 'a_cobrar'

-- 1. Verificar quantos agendamentos estão com status 'pago'
SELECT 
    'Antes da correção' as etapa,
    status,
    COUNT(*) as quantidade
FROM public.appointments 
WHERE status = 'pago'
GROUP BY status;

-- 2. Atualizar todos os agendamentos com status 'pago' para 'a_cobrar'
UPDATE public.appointments 
SET status = 'a_cobrar'
WHERE status = 'pago';

-- 3. Verificar o resultado após a correção
SELECT 
    'Após a correção' as etapa,
    status,
    COUNT(*) as quantidade
FROM public.appointments 
GROUP BY status
ORDER BY status;

-- 4. Mostrar resumo por cliente após a correção
SELECT 
    c.name as cliente,
    a.status,
    COUNT(*) as quantidade,
    SUM(a.valor_total) as valor_total
FROM public.appointments a
JOIN public.booking_clients c ON a.client_id = c.id
GROUP BY c.name, a.status
ORDER BY c.name, a.status;
