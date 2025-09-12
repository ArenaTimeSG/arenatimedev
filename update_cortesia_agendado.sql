-- Script para atualizar agendamentos cortesia com status 'agendado' para 'cortesia'
-- quando a data já passou

-- 1. Verificar agendamentos cortesia com status 'agendado' que já passaram da data
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
  AND a.status = 'agendado'
  AND a.date < NOW()
ORDER BY a.date DESC;

-- 2. Atualizar agendamentos cortesia vencidos para status 'cortesia'
UPDATE public.appointments 
SET status = 'cortesia'
WHERE is_cortesia = true 
  AND status = 'agendado'
  AND date < NOW();

-- 3. Verificar o resultado após a correção
SELECT 
    'Após correção' as etapa,
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
