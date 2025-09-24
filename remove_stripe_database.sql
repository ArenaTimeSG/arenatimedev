-- =====================================================
-- REMOVER SISTEMA DE ASSINATURA STRIPE DO BANCO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. REMOVER TABELA SUBSCRIPTIONS (se existir)
-- =====================================================
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- 2. REMOVER POLÍTICAS RLS DA TABELA SUBSCRIPTIONS (se existir)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;

-- 3. VERIFICAR SE A TABELA FOI REMOVIDA
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions'
    ) THEN
        RAISE NOTICE '✅ Tabela subscriptions removida com sucesso!';
    ELSE
        RAISE NOTICE '❌ Tabela subscriptions ainda existe';
    END IF;
END $$;

-- 4. VERIFICAR OUTRAS TABELAS RELACIONADAS AO STRIPE
-- =====================================================
SELECT 'Verificando tabelas relacionadas ao Stripe:' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name ILIKE '%stripe%' 
    OR table_name ILIKE '%subscription%'
    OR table_name ILIKE '%billing%'
)
ORDER BY table_name;

-- 5. VERIFICAR COLUNAS RELACIONADAS AO STRIPE
-- =====================================================
SELECT 'Verificando colunas relacionadas ao Stripe:' as info;

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (
    column_name ILIKE '%stripe%' 
    OR column_name ILIKE '%subscription%'
    OR column_name ILIKE '%billing%'
)
ORDER BY table_name, column_name;

SELECT '🎉 Sistema de assinatura Stripe removido do banco de dados!' as status_final;
