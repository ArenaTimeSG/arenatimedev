-- Teste simples para verificar se a tabela monthly_events existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'monthly_events'
) as table_exists;

-- Se a tabela não existir, criar ela:
CREATE TABLE IF NOT EXISTS public.monthly_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  client_name text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  start_time text NOT NULL,
  end_time text NOT NULL,
  notes text,
  guests integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('a_cobrar','pago','cancelado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.monthly_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own monthly_events" ON public.monthly_events;
CREATE POLICY "Users can view own monthly_events" ON public.monthly_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own monthly_events" ON public.monthly_events;
CREATE POLICY "Users can insert own monthly_events" ON public.monthly_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own monthly_events" ON public.monthly_events;
CREATE POLICY "Users can update own monthly_events" ON public.monthly_events
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own monthly_events" ON public.monthly_events;
CREATE POLICY "Users can delete own monthly_events" ON public.monthly_events
  FOR DELETE USING (auth.uid() = user_id);
