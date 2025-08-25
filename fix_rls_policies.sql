-- =====================================================
-- Corrigir políticas de RLS para permitir agendamento online
-- =====================================================

-- 1. Adicionar política de leitura pública para user_profiles
DO $$
BEGIN
    -- Verificar se a política já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Public can view active user profiles for booking'
    ) THEN
        -- Criar política de leitura pública
        CREATE POLICY "Public can view active user profiles for booking" ON public.user_profiles
            FOR SELECT USING (is_active = true);
        
        RAISE NOTICE 'Política de leitura pública criada para user_profiles';
    ELSE
        RAISE NOTICE 'Política de leitura pública já existe para user_profiles';
    END IF;
END $$;

-- 2. Adicionar política de leitura pública para modalities
DO $$
BEGIN
    -- Verificar se a política já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'modalities' 
        AND policyname = 'Public can view active modalities for booking'
    ) THEN
        -- Criar política de leitura pública
        CREATE POLICY "Public can view active modalities for booking" ON public.modalities
            FOR SELECT USING (true);
        
        RAISE NOTICE 'Política de leitura pública criada para modalities';
    ELSE
        RAISE NOTICE 'Política de leitura pública já existe para modalities';
    END IF;
END $$;

-- 3. Verificar políticas criadas
SELECT 'Políticas em user_profiles:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

SELECT 'Políticas em modalities:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'modalities';

-- 4. Testar acesso público
SELECT 'Teste de acesso público - user_profiles:' as info;
SELECT id, name, role, is_active 
FROM public.user_profiles 
WHERE name = 'teste'
LIMIT 1;

SELECT 'Teste de acesso público - modalities:' as info;
SELECT m.id, m.name, m.valor, up.name as user_name
FROM public.modalities m
JOIN public.user_profiles up ON m.user_id = up.user_id
WHERE up.name = 'teste'
LIMIT 3;
