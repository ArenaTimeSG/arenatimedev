-- Migração para adicionar 'cortesia' ao enum appointment_status
-- Data: 2025-01-26
-- Descrição: Adiciona o valor 'cortesia' ao enum appointment_status para suportar agendamentos cortesia

-- 1. Verificar o enum atual
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'appointment_status'
)
ORDER BY enumsortorder;

-- 2. Adicionar 'cortesia' ao enum appointment_status
ALTER TYPE appointment_status ADD VALUE 'cortesia';

-- 3. Verificar se foi adicionado corretamente
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'appointment_status'
)
ORDER BY enumsortorder;

-- 4. Agora podemos atualizar os agendamentos cortesia
UPDATE public.appointments 
SET status = 'cortesia'
WHERE is_cortesia = true 
  AND status = 'a_cobrar';

-- 5. Verificar o resultado
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
