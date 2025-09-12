-- Script para verificar e corrigir agendamentos cortesia
-- Execute este script no Supabase SQL Editor

-- 1. Verificar agendamentos cortesia atuais
SELECT 
    'Status atual' as etapa,
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

-- 2. Atualizar agendamentos cortesia vencidos para status 'cortesia'
UPDATE public.appointments 
SET status = 'cortesia'
WHERE is_cortesia = true 
  AND status = 'agendado'
  AND date < NOW();

-- 3. Verificar após atualização
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
