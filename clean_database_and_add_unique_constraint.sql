-- =====================================================
-- Limpar banco de dados e adicionar constraint de unicidade
-- =====================================================

-- 1. Primeiro, vamos verificar quantos usuários "teste" existem
SELECT id, user_id, name, role, is_active, created_at 
FROM public.user_profiles 
WHERE name ILIKE '%teste%';

-- 2. Deletar todas as modalidades (para evitar foreign key constraints)
DELETE FROM public.modalities;

-- 3. Deletar todos os agendamentos online (se existirem)
DELETE FROM public.online_reservations;

-- 4. Deletar todos os agendamentos (appointments)
DELETE FROM public.appointments;

-- 5. Deletar todos os perfis de usuário
DELETE FROM public.user_profiles;

-- 6. Verificar se a constraint de unicidade já existe
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_profiles' 
AND tc.constraint_type = 'UNIQUE'
AND kcu.column_name = 'name';

-- 7. Adicionar constraint de unicidade no nome (se não existir)
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'user_profiles' 
        AND tc.constraint_type = 'UNIQUE'
        AND kcu.column_name = 'name'
    ) THEN
        -- Adicionar constraint de unicidade
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_name_unique UNIQUE (name);
        
        RAISE NOTICE 'Constraint de unicidade adicionada ao campo name';
    ELSE
        RAISE NOTICE 'Constraint de unicidade já existe no campo name';
    END IF;
END $$;

-- 8. Verificar se a constraint foi criada
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_profiles' 
AND tc.constraint_type = 'UNIQUE'
AND kcu.column_name = 'name';

-- 9. Verificar se o banco está limpo
SELECT 'user_profiles' as tabela, COUNT(*) as total FROM public.user_profiles
UNION ALL
SELECT 'modalities' as tabela, COUNT(*) as total FROM public.modalities
UNION ALL
SELECT 'appointments' as tabela, COUNT(*) as total FROM public.appointments
UNION ALL
SELECT 'online_reservations' as tabela, COUNT(*) as total FROM public.online_reservations;
