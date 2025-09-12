-- Script para adicionar 'cortesia' ao enum appointment_status
-- Execute este script em etapas separadas no Supabase SQL Editor

-- ETAPA 1: Verificar o enum atual
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'appointment_status'
)
ORDER BY enumsortorder;

-- ETAPA 2: Adicionar 'cortesia' ao enum (execute apenas esta linha)
ALTER TYPE appointment_status ADD VALUE 'cortesia';

-- ETAPA 3: Verificar se foi adicionado (execute após a etapa 2)
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'appointment_status'
)
ORDER BY enumsortorder;

-- ETAPA 4: Atualizar agendamentos cortesia (execute após a etapa 3)
UPDATE public.appointments 
SET status = 'cortesia'
WHERE is_cortesia = true 
  AND status = 'a_cobrar';

-- ETAPA 5: Verificar o resultado final
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
