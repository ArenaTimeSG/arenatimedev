-- =====================================================
-- Teste de Integração do Agendamento Online
-- =====================================================

-- 1. Verificar usuário teste
SELECT 'Usuário teste:' as info;
SELECT 
    id,
    user_id,
    name,
    role,
    is_active,
    created_at
FROM public.user_profiles 
WHERE name = 'teste';

-- 2. Verificar modalidades do usuário teste
SELECT 'Modalidades do usuário teste:' as info;
SELECT 
    m.id,
    m.name,
    m.valor,
    up.name as user_name
FROM public.modalities m
JOIN public.user_profiles up ON m.user_id = up.user_id
WHERE up.name = 'teste';

-- 3. Verificar configurações do usuário teste
SELECT 'Configurações do usuário teste:' as info;
SELECT 
    id,
    user_id,
    working_hours,
    default_interval,
    theme,
    created_at,
    updated_at
FROM public.settings 
WHERE user_id = (
    SELECT user_id FROM public.user_profiles WHERE name = 'teste'
);

-- 4. Verificar clientes existentes
SELECT 'Clientes existentes:' as info;
SELECT 
    id,
    name,
    phone,
    email,
    user_id,
    created_at
FROM public.clients 
WHERE user_id = (
    SELECT user_id FROM public.user_profiles WHERE name = 'teste'
);

-- 5. Verificar agendamentos existentes
SELECT 'Agendamentos existentes:' as info;
SELECT 
    a.id,
    a.date,
    a.modality,
    a.status,
    a.valor_total,
    c.name as client_name,
    c.phone as client_phone
FROM public.appointments a
JOIN public.clients c ON a.client_id = c.id
WHERE a.user_id = (
    SELECT user_id FROM public.user_profiles WHERE name = 'teste'
)
ORDER BY a.date DESC
LIMIT 10;

-- 6. Verificar reservas online existentes
SELECT 'Reservas online existentes:' as info;
SELECT 
    id,
    admin_user_id,
    modalidade_id,
    data,
    horario,
    cliente_nome,
    cliente_email,
    cliente_telefone,
    valor,
    status,
    auto_confirmada,
    created_at
FROM public.online_reservations 
WHERE admin_user_id = (
    SELECT user_id FROM public.user_profiles WHERE name = 'teste'
)
ORDER BY created_at DESC
LIMIT 10;

-- 7. Teste de inserção de cliente (simular agendamento online)
SELECT 'Teste de inserção de cliente:' as info;
INSERT INTO public.clients (name, phone, email, user_id)
VALUES ('Cliente Teste Online', '(11) 99999-9999', 'cliente.teste@email.com', 
        (SELECT user_id FROM public.user_profiles WHERE name = 'teste'))
ON CONFLICT (id) DO NOTHING
RETURNING id, name, phone, email, user_id;

-- 8. Verificar se o cliente foi criado
SELECT 'Cliente criado:' as info;
SELECT 
    id,
    name,
    phone,
    email,
    user_id,
    created_at
FROM public.clients 
WHERE name = 'Cliente Teste Online'
AND user_id = (SELECT user_id FROM public.user_profiles WHERE name = 'teste');

-- 9. Teste de inserção de agendamento (simular agendamento online)
SELECT 'Teste de inserção de agendamento:' as info;
INSERT INTO public.appointments (client_id, date, status, modality, user_id, valor_total)
VALUES (
    (SELECT id FROM public.clients WHERE name = 'Cliente Teste Online' LIMIT 1),
    '2025-01-27T10:00:00Z',
    'a_cobrar',
    'Futsal',
    (SELECT user_id FROM public.user_profiles WHERE name = 'teste'),
    80.00
)
RETURNING id, client_id, date, status, modality, user_id, valor_total;

-- 10. Verificar se o agendamento foi criado
SELECT 'Agendamento criado:' as info;
SELECT 
    a.id,
    a.date,
    a.modality,
    a.status,
    a.valor_total,
    c.name as client_name,
    c.phone as client_phone
FROM public.appointments a
JOIN public.clients c ON a.client_id = c.id
WHERE a.modality = 'Futsal'
AND a.user_id = (SELECT user_id FROM public.user_profiles WHERE name = 'teste')
ORDER BY a.created_at DESC
LIMIT 5;
