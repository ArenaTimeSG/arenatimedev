-- Script para atualizar usuários existentes com username
-- Baseado no nome do usuário, gerando um username único

-- Função para gerar username a partir do nome
CREATE OR REPLACE FUNCTION generate_username_from_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(name, '[àáâãäå]', 'a', 'g'),
            '[èéêë]', 'e', 'g'
          ),
          '[ìíîï]', 'i', 'g'
        ),
        '[òóôõö]', 'o', 'g'
      ),
      '[ùúûü]', 'u', 'g'
    )
  )
  -- Remove acentos restantes
  || lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(name, '[ç]', 'c', 'g'),
            '[ñ]', 'n', 'g'
          ),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  )
  -- Remove hífens no início e fim
  || trim(both '-' from 
    regexp_replace(
      regexp_replace(name, '[àáâãäå]', 'a', 'g'),
      '[èéêë]', 'e', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Atualizar usuários existentes que não têm username
UPDATE public.user_profiles 
SET username = generate_username_from_name(name)
WHERE username IS NULL OR username = '';

-- Para usuários com nomes duplicados, adicionar número
WITH duplicates AS (
  SELECT username, COUNT(*) as count
  FROM public.user_profiles
  GROUP BY username
  HAVING COUNT(*) > 1
)
UPDATE public.user_profiles 
SET username = username || '-' || (
  SELECT COUNT(*) 
  FROM public.user_profiles up2 
  WHERE up2.username = public.user_profiles.username 
  AND up2.id <= public.user_profiles.id
)
WHERE username IN (SELECT username FROM duplicates);

-- Verificar se todos os usuários têm username
SELECT 
  id,
  name,
  username,
  CASE 
    WHEN username IS NULL OR username = '' THEN '❌ SEM USERNAME'
    ELSE '✅ OK'
  END as status
FROM public.user_profiles
ORDER BY name;
