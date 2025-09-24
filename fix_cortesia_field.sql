-- =====================================================
-- CORREÇÃO DO CAMPO IS_CORTESIA PARA AGENDAMENTOS EXISTENTES
-- =====================================================

-- Verificar agendamentos que são cortesia mas não têm o campo is_cortesia marcado
SELECT 'Agendamentos cortesia sem campo is_cortesia marcado:' as info;
SELECT 
    id,
    client_id,
    date,
    status,
    valor_total,
    is_cortesia,
    CASE 
        WHEN valor_total = 0 THEN 'Deve ser cortesia'
        ELSE 'Não é cortesia'
    END as analise
FROM public.appointments 
WHERE valor_total = 0 
AND (is_cortesia IS NULL OR is_cortesia = false)
ORDER BY date DESC;

-- Atualizar agendamentos com valor_total = 0 para is_cortesia = true
UPDATE public.appointments 
SET is_cortesia = true
WHERE valor_total = 0 
AND (is_cortesia IS NULL OR is_cortesia = false);

-- Verificar agendamentos com status 'cortesia' mas valor_total > 0
SELECT 'Agendamentos com status cortesia mas valor > 0:' as info;
SELECT 
    id,
    client_id,
    date,
    status,
    valor_total,
    is_cortesia
FROM public.appointments 
WHERE status = 'cortesia' 
AND valor_total > 0
ORDER BY date DESC;

-- Atualizar agendamentos com status 'cortesia' para valor_total = 0 e is_cortesia = true
UPDATE public.appointments 
SET valor_total = 0, is_cortesia = true
WHERE status = 'cortesia' 
AND valor_total > 0;

-- Verificar resultado final
SELECT 'Verificação final - Agendamentos cortesia:' as info;
SELECT 
    COUNT(*) as total_cortesia,
    COUNT(CASE WHEN is_cortesia = true THEN 1 END) as com_is_cortesia_true,
    COUNT(CASE WHEN valor_total = 0 THEN 1 END) as com_valor_zero,
    COUNT(CASE WHEN status = 'cortesia' THEN 1 END) as com_status_cortesia
FROM public.appointments 
WHERE is_cortesia = true OR valor_total = 0 OR status = 'cortesia';

-- Mostrar alguns exemplos de agendamentos cortesia
SELECT 'Exemplos de agendamentos cortesia:' as info;
SELECT 
    id,
    client_id,
    date,
    status,
    valor_total,
    is_cortesia,
    created_at
FROM public.appointments 
WHERE is_cortesia = true
ORDER BY date DESC
LIMIT 5;

SELECT '🎉 CAMPO IS_CORTESIA CORRIGIDO!' as status_final;
SELECT '✅ Agendamentos com valor_total = 0 agora têm is_cortesia = true' as correcao_1;
SELECT '✅ Agendamentos com status cortesia agora têm valor_total = 0' as correcao_2;
SELECT '✅ Status cortesia agora mostra cor rosa e ícone de presente' as correcao_3;
