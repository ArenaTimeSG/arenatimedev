# Correções no Fluxo de Pagamento - ArenaTime

## Problema Identificado

O sistema estava confirmando agendamentos mesmo sem o pagamento aprovado quando a política de pagamento era "obrigatório". Isso acontecia porque:

1. O agendamento era criado com status `'agendado'` quando `autoConfirmada` era `true`, independente da política de pagamento
2. O webhook do Mercado Pago não estava atualizando corretamente o status dos agendamentos
3. O frontend não mostrava adequadamente o status de pagamento pendente

## Correções Implementadas

### 1. Fluxo de Criação de Agendamentos (`src/hooks/useClientBookings.ts`)

**Antes:**
```typescript
status: autoConfirmada ? 'agendado' : 'a_cobrar'
```

**Depois:**
```typescript
if (bookingData.payment_policy === 'obrigatorio') {
  paymentStatus = 'pending';
  // Para pagamento obrigatório, SEMPRE criar como 'a_cobrar' (pendente)
  appointmentStatus = 'a_cobrar';
} else if (bookingData.payment_policy === 'opcional') {
  paymentStatus = 'not_required';
  appointmentStatus = autoConfirmada ? 'agendado' : 'a_cobrar';
} else {
  // Para 'sem_pagamento', usar auto_confirmada para determinar o status
  appointmentStatus = autoConfirmada ? 'agendado' : 'a_cobrar';
}
```

**Resultado:** Agendamentos com pagamento obrigatório são SEMPRE criados como `'a_cobrar'` (pendente), independente da configuração de auto-agendamento.

### 2. Webhook do Mercado Pago (`supabase/functions/mercado-pago-webhook/index.ts`)

**Correções Implementadas:**
- ✅ **Validação de assinatura HMAC-SHA256** com chave secreta do Mercado Pago
- ✅ **Sem autenticação JWT** (`export const config = { auth: false }`)
- ✅ **Fluxo correto de pagamento:**
  - Quando pagamento é `'approved'`: agendamento muda para `'agendado'` (confirmado)
  - Quando pagamento é `'rejected'` ou `'cancelled'`: `payment_status` fica `'failed'` (horário liberado)
  - Quando pagamento está `'pending'` ou `'in_process'`: aguarda processamento
- ✅ **Busca real do status** na API do Mercado Pago usando access_token do admin
- ✅ **Sempre responde 200 OK** ao Mercado Pago quando processamento é bem-sucedido

### 3. Função de Criação de Preferência (`supabase/functions/create-payment-preference/index.ts`)

**Melhorias:**
- Adicionado tratamento de erros ao salvar registro de pagamento
- Melhor logging para debugging
- Atualização do `payment_status` do agendamento para `'pending'` quando preferência é criada

### 4. Frontend - Exibição de Status

**Componentes Atualizados:**
- `AppointmentCard.tsx`
- `ResponsiveCalendar.tsx`
- `AgendamentosMenu.tsx`
- `AppointmentDetailsModal.tsx`

**Novos Status Visuais:**
- **Aguardando Pagamento** (amarelo): `payment_status = 'pending'`
- **Pagamento Falhou** (vermelho): `payment_status = 'failed'`
- **Agendado** (verde): `status = 'agendado'` e pagamento aprovado
- **Pendente** (laranja): `status = 'a_cobrar'` sem pagamento obrigatório

## Fluxo Corrigido

### Para Pagamento Obrigatório:

1. **Cliente agenda horário** → Agendamento criado com `status: 'a_cobrar'` e `payment_status: 'pending'`
2. **Sistema gera preferência** → Mercado Pago cria link de pagamento
3. **Cliente é redirecionado** → Para checkout do Mercado Pago
4. **Cliente paga** → Mercado Pago envia webhook
5. **Webhook processa** → Se aprovado: `status: 'agendado'`, se rejeitado: `payment_status: 'failed'`

### Para Pagamento Opcional:

1. **Cliente agenda horário** → Agendamento criado com `status: 'agendado'` (se auto_confirmada) ou `'a_cobrar'`
2. **Cliente pode pagar depois** → Através do painel administrativo

### Para Sem Pagamento:

1. **Cliente agenda horário** → Agendamento criado com `status: 'agendado'` (se auto_confirmada) ou `'a_cobrar'`
2. **Sem processo de pagamento** → Funciona como antes

## Campos do Banco de Dados

### Tabela `appointments`:
- `status`: `'a_cobrar' | 'agendado' | 'cancelado'` (status principal)
- `payment_status`: `'not_required' | 'pending' | 'failed'` (status do pagamento)

### Tabela `payments`:
- `status`: `'pending' | 'approved' | 'rejected' | 'cancelled'`
- `mercado_pago_id`: ID da preferência no Mercado Pago
- `mercado_pago_payment_id`: ID do pagamento no Mercado Pago

## Testes Recomendados

1. **Teste Pagamento Obrigatório:**
   - Configurar política como "obrigatório"
   - Fazer agendamento online
   - Verificar se status fica "Aguardando Pagamento"
   - Simular pagamento aprovado via webhook
   - Verificar se status muda para "Agendado"

2. **Teste Pagamento Rejeitado:**
   - Fazer agendamento com pagamento obrigatório
   - Simular pagamento rejeitado via webhook
   - Verificar se status fica "Pagamento Falhou"

3. **Teste Pagamento Opcional:**
   - Configurar política como "opcional"
   - Fazer agendamento online
   - Verificar se status fica "Agendado" (se auto_confirmada) ou "Pendente"

## Validação de Segurança

### Assinatura HMAC-SHA256
A função webhook agora valida a assinatura do Mercado Pago:

```typescript
// Chave secreta do Mercado Pago
const MP_SECRET = "3e4dd2471dc790953af86a9a16d57e3f02ba8d5875e1c86cbb40d43c426c0bc9";

// Validação da assinatura
const signature = req.headers.get("x-signature");
const hash = createHmac("sha256", MP_SECRET).update(rawBody).toString();

if (signature !== hash) {
  return new Response("Invalid signature", { status: 401 });
}
```

### Configuração de Segurança
- ✅ **Sem autenticação JWT**: `export const config = { auth: false }`
- ✅ **Validação de assinatura obrigatória**: Retorna 401 se assinatura inválida
- ✅ **Headers CORS configurados**: Inclui `x-signature` para validação

## Status Sincronizados

O sistema agora garante que:
- ✅ Nenhum agendamento é confirmado sem pagamento aprovado quando obrigatório
- ✅ Status no banco está sempre sincronizado com o Mercado Pago via webhook
- ✅ Frontend mostra status claro e correto para o usuário
- ✅ Suporte mantido para modo sem pagamento e pagamento opcional
- ✅ **Validação de segurança** com assinatura HMAC-SHA256
- ✅ **Horários liberados** quando pagamento falha (não ocupam quadra)
