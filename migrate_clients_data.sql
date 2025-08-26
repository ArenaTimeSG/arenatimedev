-- =====================================================
-- MIGRAR DADOS DA TABELA CLIENTS PARA BOOKING_CLIENTS
-- =====================================================

-- 1. VERIFICAR SE A TABELA CLIENTS EXISTE
DO $$
DECLARE
    table_exists BOOLEAN;
    client_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICANDO TABELA CLIENTS ===';
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'clients'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabela clients existe';
        
        -- Contar clientes na tabela antiga
        SELECT COUNT(*) INTO client_count FROM public.clients;
        RAISE NOTICE '📊 Clientes na tabela antiga: %', client_count;
        
        -- Migrar dados se houver clientes
        IF client_count > 0 THEN
            RAISE NOTICE '🔄 Iniciando migração de dados...';
            
            -- Inserir clientes da tabela antiga para a nova
            INSERT INTO public.booking_clients (name, email, phone, password_hash)
            SELECT 
                name,
                COALESCE(email, 'cliente_' || id || '@migrado.com'),
                phone,
                'migrado_' || id -- Hash temporário para clientes migrados
            FROM public.clients
            ON CONFLICT (email) DO NOTHING;
            
            RAISE NOTICE '✅ Migração concluída!';
            
            -- Mostrar quantos foram migrados
            SELECT COUNT(*) INTO client_count FROM public.booking_clients WHERE password_hash LIKE 'migrado_%';
            RAISE NOTICE '📊 Clientes migrados: %', client_count;
        ELSE
            RAISE NOTICE 'ℹ️ Nenhum cliente para migrar';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Tabela clients não existe - não há dados para migrar';
    END IF;
END $$;

-- 2. VERIFICAR DADOS FINAIS
DO $$
DECLARE
    total_clients INTEGER;
    migrated_clients INTEGER;
    online_clients INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICANDO DADOS FINAIS ===';
    
    -- Total de clientes
    SELECT COUNT(*) INTO total_clients FROM public.booking_clients;
    RAISE NOTICE '📊 Total de clientes: %', total_clients;
    
    -- Clientes migrados
    SELECT COUNT(*) INTO migrated_clients FROM public.booking_clients WHERE password_hash LIKE 'migrado_%';
    RAISE NOTICE '📊 Clientes migrados: %', migrated_clients;
    
    -- Clientes online (não migrados)
    SELECT COUNT(*) INTO online_clients FROM public.booking_clients WHERE password_hash NOT LIKE 'migrado_%';
    RAISE NOTICE '📊 Clientes online: %', online_clients;
    
    -- Listar alguns clientes como exemplo
    RAISE NOTICE '📋 Exemplos de clientes:';
    FOR i IN 1..5 LOOP
        DECLARE
            client_record RECORD;
        BEGIN
            SELECT name, email, phone, 
                   CASE WHEN password_hash LIKE 'migrado_%' THEN 'Migrado' ELSE 'Online' END as tipo
            INTO client_record
            FROM public.booking_clients 
            ORDER BY created_at DESC 
            LIMIT 1 OFFSET (i-1);
            
            IF FOUND THEN
                RAISE NOTICE '  - % | % | % | %', 
                    client_record.name, 
                    client_record.email, 
                    client_record.phone, 
                    client_record.tipo;
            END IF;
        END;
    END LOOP;
END $$;

-- 3. REMOVER TABELA ANTIGA (OPCIONAL - DESCOMENTE SE QUISER)
-- DROP TABLE IF EXISTS public.clients;

RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
