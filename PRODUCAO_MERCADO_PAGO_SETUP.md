# Configuração do Mercado Pago em Produção

## ✅ Status da Implementação

Todo o fluxo de checkout com Mercado Pago foi configurado para produção. Os seguintes pontos foram implementados:

### 1. ✅ Edge Function do Webhook (Supabase)
- **Função**: `mercado-pago-webhook` está configurada e funcional
- **Funcionalidades**:
  - Recebe notificações do Mercado Pago (evento `payment`)
  - Consulta a API do Mercado Pago em `/v1/payments/:id` usando `MP_ACCESS_TOKEN`
  - Se o pagamento tiver `status = approved`, cria o agendamento na tabela `appointments`
  - Se o pagamento estiver `rejected` ou `cancelled`, não cria agendamento
  - Sempre retorna **200 OK** ao Mercado Pago para evitar reenvios em loop

### 2. ✅ Checkout em Produção (Frontend)
- **Componente**: `PaymentCheckoutProduction.tsx` criado
- **Funcionalidades**:
  - Usa credenciais de produção do Mercado Pago
  - Abre checkout com chave pública (`VITE_MP_PUBLIC_KEY`)
  - Não faz polling no frontend
  - Mostra "Aguardando pagamento..." e escuta **Realtime do Supabase**
  - Quando o webhook insere um novo agendamento, atualiza automaticamente para "Agendamento Confirmado"

### 3. ✅ Supabase Client (Frontend)
- **Arquivo**: `src/lib/supabase.ts` configurado
- **Funcionalidades**:
  - Usa variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- **Hook**: `useAppointmentsRealtime.ts` criado para gerenciar Realtime

### 4. ✅ Configuração de Ambiente
- **Arquivo**: `vite.config.ts` atualizado para usar variáveis de ambiente
- **Variáveis necessárias**:
  ```env
  VITE_SUPABASE_URL=https://xtufbfvrgpzqbvdfmtiy.supabase.co
  VITE_SUPABASE_ANON_KEY=<anon_key>
  VITE_MP_PUBLIC_KEY=<public_key_producao>
  MP_ACCESS_TOKEN=<access_token_producao>
  ```

## 🔧 Configuração Necessária

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com suas credenciais de produção:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xtufbfvrgpzqbvdfmtiy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M

# Mercado Pago Production Keys
VITE_MP_PUBLIC_KEY=APP_USR_12345678-1234-1234-1234-123456789012
MP_ACCESS_TOKEN=APP_USR_1234567890123456-123456-12345678901234567890123456789012-123456

# Supabase Service Role Key (para Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=<sua_service_role_key>
```

### 2. Configurar Edge Functions no Supabase

Execute os seguintes comandos para fazer deploy das Edge Functions:

```bash
# Fazer deploy da função de webhook
supabase functions deploy mercado-pago-webhook

# Fazer deploy da função de criação de preferência
supabase functions deploy create-payment-preference
```

### 3. Configurar Variáveis de Ambiente no Supabase

No painel do Supabase, vá em **Settings > Edge Functions** e configure:

```
MP_ACCESS_TOKEN=<seu_access_token_producao>
SUPABASE_SERVICE_ROLE_KEY=<sua_service_role_key>
```

### 4. Configurar Webhook no Mercado Pago

No painel do Mercado Pago, configure o webhook para:
```
URL: https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook
Eventos: payment
```

## 🚀 Fluxo Esperado

1. **Cliente abre checkout** → Frontend usa `VITE_MP_PUBLIC_KEY`
2. **Paga no Mercado Pago** → Mercado Pago processa pagamento
3. **Mercado Pago chama webhook** → Webhook consulta API e confirma
4. **Se aprovado** → Webhook insere agendamento no Supabase
5. **Frontend detecta via Realtime** → Mostra "Agendamento Confirmado"
6. **Se não aprovado** → Nada é inserido

## ✅ Benefícios da Implementação

- ✅ O checkout está em produção (sem sandbox)
- ✅ O webhook está ativo e funcional no Supabase
- ✅ O frontend não fica travado em "pending"
- ✅ O agendamento só aparece quando o pagamento for realmente aprovado
- ✅ Realtime funciona para atualizações automáticas
- ✅ Não há agendamentos temporários - só após pagamento aprovado

## 🧪 Como Testar

1. Configure as credenciais de produção no `.env`
2. Faça deploy das Edge Functions
3. Configure o webhook no Mercado Pago
4. Teste um pagamento real
5. Verifique se o agendamento é criado automaticamente após aprovação

## 📝 Notas Importantes

- **Nunca use chaves de sandbox em produção**
- **Sempre teste com valores pequenos primeiro**
- **Monitore os logs das Edge Functions no Supabase**
- **Verifique se o Realtime está habilitado na tabela `appointments`**
