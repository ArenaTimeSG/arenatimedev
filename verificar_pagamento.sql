-- Script para verificar se os agendamentos estão realmente marcados como pago

-- 1. Verificar todos os agendamentos com status 'pago'
SELECT 
    'Agendamentos marcados como PAGO' as tipo,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM public.appointments 
WHERE status = 'pago';

-- 2. Verificar todos os agendamentos com status 'a_cobrar'
SELECT 
    'Agendamentos marcados como A COBRAR' as tipo,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM public.appointments 
WHERE status = 'a_cobrar';

-- 3. Verificar o agendamento específico que foi pago (substitua pelo ID correto)
SELECT 
    id,
    date,
    status,
    valor_total,
    client_id,
    created_at,
    updated_at
FROM public.appointments 
WHERE id = '7bfb1595-1ad7-41bc-9253-3128ca414550';

-- 4. Verificar todos os status possíveis
SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM public.appointments 
GROUP BY status
ORDER BY status;
