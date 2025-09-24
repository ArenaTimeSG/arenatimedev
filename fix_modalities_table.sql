-- =====================================================
-- CORREÇÃO DA TABELA MODALITIES
-- =====================================================

-- Criar tabela modalities se não existir
CREATE TABLE IF NOT EXISTS public.modalities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT modalities_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT modalities_valor_positive CHECK (valor >= 0)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_modalities_user_id ON public.modalities(user_id);
CREATE INDEX IF NOT EXISTS idx_modalities_name ON public.modalities(name);

-- Habilitar RLS
ALTER TABLE public.modalities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA MODALITIES
-- =====================================================

-- Política para SELECT: usuários podem ver apenas suas próprias modalidades
CREATE POLICY "Users can view own modalities" ON public.modalities
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar modalidades para si mesmos
CREATE POLICY "Users can create own modalities" ON public.modalities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar apenas suas próprias modalidades
CREATE POLICY "Users can update own modalities" ON public.modalities
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar apenas suas próprias modalidades
CREATE POLICY "Users can delete own modalities" ON public.modalities
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para modalities
DROP TRIGGER IF EXISTS update_modalities_updated_at ON public.modalities;
CREATE TRIGGER update_modalities_updated_at
    BEFORE UPDATE ON public.modalities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 'Verificando tabela modalities:' as info;

SELECT 
    table_name,
    '✅ Criada' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'modalities';

-- Verificar estrutura da tabela
SELECT 'Estrutura da tabela modalities:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'modalities' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 'Políticas RLS da tabela modalities:' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'modalities' AND schemaname = 'public'
ORDER BY policyname;

SELECT '🎉 TABELA MODALITIES CRIADA E CONFIGURADA COM SUCESSO!' as status_final;
