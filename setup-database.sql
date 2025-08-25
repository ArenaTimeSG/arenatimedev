-- Script completo para configurar o banco de dados do projeto Agenda
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar enums
CREATE TYPE appointment_status AS ENUM ('a_cobrar', 'pago', 'cancelado');
CREATE TYPE recurrence_type AS ENUM ('data_final', 'repeticoes', 'indeterminado');
CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'cancelado');

-- 2. Criar tabela clients
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Criar tabela recurrences
CREATE TABLE public.recurrences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type recurrence_type NOT NULL,
    end_date DATE,
    repetitions INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Criar tabela appointments
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status NOT NULL DEFAULT 'a_cobrar',
    recurrence_id UUID REFERENCES public.recurrences(id) ON DELETE SET NULL,
    modality TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Criar tabela payments
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Criar tabela settings
CREATE TABLE public.settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    modalities_enabled JSONB NOT NULL DEFAULT '{
        "volei": true,
        "futsal": true,
        "basquete": true
    }'::jsonb,
    
    modalities_colors JSONB NOT NULL DEFAULT '{
        "volei": "#3b82f6",
        "futsal": "#10b981",
        "basquete": "#f59e0b"
    }'::jsonb,
    
    working_hours JSONB NOT NULL DEFAULT '{
        "monday": {"start": "08:00", "end": "22:00", "enabled": true},
        "tuesday": {"start": "08:00", "end": "22:00", "enabled": true},
        "wednesday": {"start": "08:00", "end": "22:00", "enabled": true},
        "thursday": {"start": "08:00", "end": "22:00", "enabled": true},
        "friday": {"start": "08:00", "end": "22:00", "enabled": true},
        "saturday": {"start": "08:00", "end": "18:00", "enabled": true},
        "sunday": {"start": "08:00", "end": "18:00", "enabled": false}
    }'::jsonb,
    
    default_interval INTEGER NOT NULL DEFAULT 60,
    
    notifications_enabled JSONB NOT NULL DEFAULT '{
        "email": true,
        "push": false,
        "booking": true,
        "cancellation": true,
        "payment": true
    }'::jsonb,
    
    theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'custom')),
    
    personal_data JSONB NOT NULL DEFAULT '{
        "name": "",
        "email": "",
        "phone": ""
    }'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(user_id)
);

-- 7. Criar tabela user_profiles
CREATE TABLE public.user_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(user_id)
);

-- 8. Habilitar Row Level Security em todas as tabelas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS
CREATE POLICY "Authenticated users can manage clients" 
ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage appointments" 
ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage recurrences" 
ON public.recurrences FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage payments" 
ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage their own settings" 
ON public.settings FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profile" 
ON public.user_profiles FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 10. Criar índices para performance
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX idx_settings_user_id ON public.settings(user_id);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- 11. Conceder permissões
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.recurrences TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.settings TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 12. Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Criar triggers para atualizar timestamp
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 14. Criar função para inicializar configurações padrão
CREATE OR REPLACE FUNCTION create_default_settings()
RETURNS TRIGGER AS $$
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
    
    -- Criar perfil do usuário
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id) THEN
        INSERT INTO public.user_profiles (
            user_id,
            name,
            email,
            phone,
            role
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            'user'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Criar trigger para novos usuários
CREATE TRIGGER create_user_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_settings();

-- 16. Inserir configurações para usuários existentes (se houver)
INSERT INTO public.settings (
    user_id,
    modalities_enabled,
    modalities_colors,
    working_hours,
    default_interval,
    notifications_enabled,
    theme,
    personal_data
)
SELECT 
    u.id,
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
        'name', COALESCE(u.raw_user_meta_data->>'name', ''),
        'email', u.email,
        'phone', COALESCE(u.raw_user_meta_data->>'phone', '')
    )
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.settings s WHERE s.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Inserir perfis para usuários existentes
INSERT INTO public.user_profiles (
    user_id,
    name,
    email,
    phone,
    role
)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', 'Usuário'),
    u.email,
    COALESCE(u.raw_user_meta_data->>'phone', ''),
    'user'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 17. Verificação final
SELECT 
    'Tabelas criadas:' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'appointments', 'recurrences', 'payments', 'settings', 'user_profiles');


