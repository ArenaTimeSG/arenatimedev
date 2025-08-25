-- =====================================================
-- Corrigir função de trigger create_default_settings
-- =====================================================

-- 1. Remover o trigger antigo
DROP TRIGGER IF EXISTS create_user_settings ON auth.users;

-- 2. Corrigir a função create_default_settings
CREATE OR REPLACE FUNCTION create_default_settings()
RETURNS TRIGGER AS $$
DECLARE
    generated_username TEXT;
BEGIN
    -- Verificar se já existem configurações para este usuário
    IF NOT EXISTS (SELECT 1 FROM public.settings WHERE user_id = NEW.id) THEN
        INSERT INTO public.settings (
            user_id,
            modalities_enabled,
            modalities_colors,
            working_hours,
            default_interval,
            notifications_enabled,
            theme,
            personal_data
        ) VALUES (
            NEW.id,
            '{
                "volei": true,
                "futsal": true,
                "basquete": true
            }'::jsonb,
            '{
                "volei": "#3b82f6",
                "futsal": "#10b981",
                "basquete": "#f59e0b"
            }'::jsonb,
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
            '{
                "email": true,
                "push": false,
                "booking": true,
                "cancellation": true,
                "payment": true
            }'::jsonb,
            'light',
            jsonb_build_object(
                'name', COALESCE(NEW.raw_user_meta_data->>'name', ''),
                'email', NEW.email,
                'phone', COALESCE(NEW.raw_user_meta_data->>'phone', '')
            )
        );
    END IF;
    
    -- Criar perfil do usuário (agora com username)
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id) THEN
        -- Gerar username a partir do nome ou email
        generated_username := COALESCE(
            NEW.raw_user_meta_data->>'username',
            lower(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            regexp_replace(
                                regexp_replace(
                                    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
                                    '[àáâãäå]', 'a', 'g'
                                ),
                                '[èéêë]', 'e', 'g'
                            ),
                            '[ìíîï]', 'i', 'g'
                        ),
                        '[òóôõö]', 'o', 'g'
                    ),
                    '[ùúûü]', 'u', 'g'
                )
            )
        );
        
        -- Limpar o username gerado
        generated_username := lower(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            regexp_replace(generated_username, '[ç]', 'c', 'g'),
                            '[ñ]', 'n', 'g'
                        ),
                        '[^a-zA-Z0-9\s-]', '', 'g'
                    ),
                    '\s+', '-', 'g'
                ),
                '-+', '-', 'g'
            )
        );
        
        -- Remover hífens no início e fim
        generated_username := trim(both '-' from generated_username);
        
        -- Garantir que o username tenha pelo menos 3 caracteres
        IF length(generated_username) < 3 THEN
            generated_username := 'user-' || substr(md5(random()::text), 1, 6);
        END IF;
        
        -- Verificar se o username já existe e adicionar número se necessário
        WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = generated_username) LOOP
            generated_username := generated_username || '-' || floor(random() * 1000)::text;
        END LOOP;
        
        INSERT INTO public.user_profiles (
            user_id,
            name,
            email,
            phone,
            username,
            role,
            is_active
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            generated_username,
            'user',
            true
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
CREATE TRIGGER create_user_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_settings();

-- 4. Verificar se a função foi criada corretamente
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'create_default_settings';

-- 5. Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_settings';
