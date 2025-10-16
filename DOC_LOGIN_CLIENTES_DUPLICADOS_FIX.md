## Correção: Login com clientes duplicados por agenda (sem interferência)

### Contexto
- No fluxo de agendamento online eram criados “clientes de agenda” (associados a `user_id`) com `password_hash` temporário (`'temp_hash'`).
- Isso causava conflito no login do painel do cliente quando havia duplicidade de email: o login tentava validar contra registros de agenda.
- Objetivo: permitir duplicidade de email por agenda sem quebrar o login do cliente global, mantendo login funcional em múltiplos dispositivos e sem validação local.

### Estratégia aplicada
1) Clientes de agenda não possuem senha de login
- Para qualquer criação de cliente vinculada a uma agenda (`user_id` definido), salvar `password_hash = NULL`.
- Resultado: esses registros nunca “competem” no login, pois o login só considera quem tem senha.

2) Login 100% no banco (sem validação local)
- Normalização de email: `trim().toLowerCase()` no cadastro e no login.
- Consulta de login prioriza:
  - Quando há `user_id` no request: `email normalizado + user_id + password_hash = hash(password)`
  - Senão: `email normalizado + password_hash = hash(password)`
- Ordena por `updated_at/created_at` e retorna 1 registro (casos legados).

3) Ajustes no banco
- Tornar `password_hash` anulável e remover qualquer default.
- Zerar senhas de clientes de agenda existentes (`user_id IS NOT NULL`) para `NULL`.

### Arquivos alterados
- `src/hooks/useClientAuth.ts`
  - Login: validação 100% via banco, com email normalizado e opção de priorizar `user_id`.
  - Registro: normalização de email antes de salvar e verificação que ignora registros de agenda.

- `src/pages/ClientLogin.tsx`
  - Normalização de email antes de enviar ao hook de login.

- `src/components/AddClientModal.tsx`
  - Criação de cliente por admin/agenda com `password_hash: null` e email normalizado.

- `src/pages/NewClient.tsx`
  - Criação de cliente por admin com `password_hash: null` e email normalizado.

- `src/hooks/useOnlineBooking.ts`
  - Criação de cliente no agendamento online com `password_hash: null` e email normalizado.

- `src/hooks/useClientBookings.ts`
  - Criação/consulta de cliente para agendamento com `password_hash: null` e email normalizado.

### SQL aplicado (Supabase)
```sql
-- Tornar password_hash anulável e remover default
ALTER TABLE public.booking_clients ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE public.booking_clients ALTER COLUMN password_hash DROP DEFAULT;

-- Zerar senha de clientes de agenda (evita competição no login)
UPDATE public.booking_clients
SET password_hash = NULL
WHERE user_id IS NOT NULL AND password_hash IS NOT NULL;

-- (Opcional) Normalizar emails existentes
UPDATE public.booking_clients
SET email = LOWER(TRIM(email))
WHERE email <> LOWER(TRIM(email));
```

### Por que funciona
- Registros de agenda não têm senha, então não são considerados no login.
- O login encontra apenas quem tem `password_hash = hash(password)`, garantindo comportamento consistente em qualquer dispositivo.
- Email normalizado evita falhas por variação de caixa/espaços.

### Passos de teste
1. Cadastro global do cliente com senha e email X.
2. Criar agendamento online para o mesmo email X:
   - Deve criar cliente vinculado à agenda com `password_hash = NULL`.
3. Realizar login no painel do cliente com email X e senha correta:
   - Deve autenticar no registro global, ignorando o temporário.
4. Repetir login em outro dispositivo/navegador:
   - Deve funcionar igual (sem validação local).

### Observações
- Se existirem fluxos novos que criem `booking_clients` para agenda, garantir sempre `password_hash = NULL` e email normalizado.
- Políticas RLS devem permitir SELECT público em `booking_clients` para consulta de login (se aplicável).


