-- =====================================================
-- CORRIGIR CONFIGURAÇÃO DE HORÁRIOS DE FUNCIONAMENTO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA SETTINGS
-- =====================================================
SELECT 'Verificando estrutura da tabela settings:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE A COLUNA WORKING_HOURS EXISTE
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'working_hours'
    ) THEN
        RAISE NOTICE '✅ Coluna working_hours existe na tabela settings';
    ELSE
        RAISE NOTICE '❌ Coluna working_hours NÃO existe na tabela settings';
    END IF;
END $$;

-- 3. ADICIONAR COLUNA WORKING_HOURS SE NÃO EXISTIR
-- =====================================================
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS working_hours JSONB NOT NULL DEFAULT '{
    "monday": {"start": "08:00", "end": "22:00", "enabled": true},
    "tuesday": {"start": "08:00", "end": "22:00", "enabled": true},
    "wednesday": {"start": "08:00", "end": "22:00", "enabled": true},
    "thursday": {"start": "08:00", "end": "22:00", "enabled": true},
    "friday": {"start": "08:00", "end": "22:00", "enabled": true},
    "saturday": {"start": "08:00", "end": "18:00", "enabled": true},
    "sunday": {"start": "08:00", "end": "18:00", "enabled": false}
}'::jsonb;

-- 4. ADICIONAR COLUNA TIME_FORMAT_INTERVAL SE NÃO EXISTIR
-- =====================================================
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS time_format_interval INTEGER NOT NULL DEFAULT 60 CHECK (time_format_interval IN (30, 60));

-- 5. ADICIONAR COLUNA ONLINE_ENABLED SE NÃO EXISTIR
-- =====================================================
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS online_enabled BOOLEAN NOT NULL DEFAULT false;

-- 6. ADICIONAR COLUNA ONLINE_BOOKING SE NÃO EXISTIR
-- =====================================================
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS online_booking JSONB NOT NULL DEFAULT '{
    "auto_agendar": false,
    "tempo_minimo_antecedencia": 24,
    "duracao_padrao": 60
}'::jsonb;

-- 7. ATUALIZAR CONFIGURAÇÕES EXISTENTES COM VALORES PADRÃO
-- =====================================================
UPDATE public.settings 
SET 
    working_hours = COALESCE(working_hours, '{
        "monday": {"start": "08:00", "end": "22:00", "enabled": true},
        "tuesday": {"start": "08:00", "end": "22:00", "enabled": true},
        "wednesday": {"start": "08:00", "end": "22:00", "enabled": true},
        "thursday": {"start": "08:00", "end": "22:00", "enabled": true},
        "friday": {"start": "08:00", "end": "22:00", "enabled": true},
        "saturday": {"start": "08:00", "end": "18:00", "enabled": true},
        "sunday": {"start": "08:00", "end": "18:00", "enabled": false}
    }'::jsonb),
    time_format_interval = COALESCE(time_format_interval, 60),
    online_enabled = COALESCE(online_enabled, false),
    online_booking = COALESCE(online_booking, '{
        "auto_agendar": false,
        "tempo_minimo_antecedencia": 24,
        "duracao_padrao": 60
    }'::jsonb)
WHERE working_hours IS NULL 
   OR time_format_interval IS NULL 
   OR online_enabled IS NULL 
   OR online_booking IS NULL;

-- 8. VERIFICAR CONFIGURAÇÕES EXISTENTES
-- =====================================================
SELECT 'Configurações existentes:' as info;
SELECT 
    user_id,
    working_hours,
    time_format_interval,
    online_enabled,
    online_booking
FROM public.settings
LIMIT 5;

-- 9. TESTAR INSERÇÃO DE NOVA CONFIGURAÇÃO
-- =====================================================
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Pegar o primeiro usuário para teste
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Inserir configuração de teste se não existir
        INSERT INTO public.settings (
            user_id,
            working_hours,
            time_format_interval,
            online_enabled,
            online_booking
        ) VALUES (
            test_user_id,
            '{
                "monday": {"start": "08:00", "end": "22:00", "enabled": true},
                "tuesday": {"start": "08:00", "end": "22:00", "enabled": true},
                "wednesday": {"start": "08:00", "end": "22:00", "enabled": true},
                "thursday": {"start": "08:00", "end": "22:00", "enabled": true},
                "friday": {"start": "08:00", "end": "22:00", "enabled": true},
                "saturday": {"start": "08:00", "end": "18:00", "enabled": true},
                "sunday": {"start": "08:00", "end": "18:00", "enabled": false}
            }'::jsonb,
            60,
            false,
            '{
                "auto_agendar": false,
                "tempo_minimo_antecedencia": 24,
                "duracao_padrao": 60
            }'::jsonb
        ) ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE '✅ Configuração de teste inserida/atualizada para usuário: %', test_user_id;
    ELSE
        RAISE NOTICE '❌ Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- 10. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'Estrutura final da tabela settings:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '🎉 Configuração de horários de funcionamento corrigida!' as status_final;
