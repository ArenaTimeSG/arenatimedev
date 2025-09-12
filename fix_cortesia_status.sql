-- Script para corrigir status de agendamentos cortesia
-- Altera agendamentos cortesia com status 'a_cobrar' para 'cortesia'

-- 1. Verificar agendamentos cortesia com status incorreto
SELECT 
    'Antes da correção' as etapa,
    a.id,
    a.date,
    a.status,
    a.valor_total,
    a.is_cortesia,
    c.name as cliente
FROM public.appointments a
JOIN public.booking_clients c ON a.client_id = c.id
WHERE a.is_cortesia = true 
  AND a.status = 'a_cobrar'
ORDER BY a.date DESC;

-- 2. Atualizar agendamentos cortesia com status 'a_cobrar' para 'cortesia'
UPDATE public.appointments 
SET status = 'cortesia'
WHERE is_cortesia = true 
  AND status = 'a_cobrar';

-- 3. Verificar o resultado após a correção
SELECT 
    'Após a correção' as etapa,
    a.id,
    a.date,
    a.status,
    a.valor_total,
    a.is_cortesia,
    c.name as cliente
FROM public.appointments a
JOIN public.booking_clients c ON a.client_id = c.id
WHERE a.is_cortesia = true
ORDER BY a.date DESC;

-- 4. Mostrar resumo por status após a correção
SELECT 
    'Resumo por status' as etapa,
    status,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM public.appointments 
WHERE is_cortesia = true
GROUP BY status
ORDER BY status;
