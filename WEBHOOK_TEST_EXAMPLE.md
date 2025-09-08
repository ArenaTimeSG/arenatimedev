# Teste da Função Webhook do Mercado Pago

## Configuração do Webhook

### URL do Webhook
```
https://seu-projeto.supabase.co/functions/v1/mercado-pago-webhook
```

### Configuração no Mercado Pago
1. Acesse o painel do Mercado Pago
2. Vá para "Webhooks" nas configurações
3. Adicione a URL acima
4. Selecione eventos: `payment`
5. Salve a configuração

## Teste de Validação de Assinatura

### Exemplo de Requisição Válida
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/mercado-pago-webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: hash_calculado_com_hmac_sha256" \
  -d '{
    "type": "payment",
    "data": {
      "id": "123456789"
    }
  }'
```

### Exemplo de Requisição Inválida (sem assinatura)
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/mercado-pago-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {
      "id": "123456789"
    }
  }'
# Retorna: 401 Unauthorized
```

## Fluxo de Teste Completo

### 1. Criar Agendamento com Pagamento Obrigatório
```typescript
// No frontend
const bookingData = {
  user_id: "admin-id",
  client_id: "client-id", 
  date: "2024-01-15T10:00:00Z",
  modality: "Quadra 1",
  valor_total: 50.00,
  payment_policy: "obrigatorio"
};

// Resultado: Agendamento criado com status "a_cobrar" e payment_status "pending"
```

### 2. Criar Preferência de Pagamento
```typescript
// Chama a função create-payment-preference
const paymentData = {
  user_id: "admin-id",
  amount: 50.00,
  description: "Agendamento - Quadra 1",
  client_name: "João Silva",
  client_email: "joao@email.com",
  appointment_id: "appointment-id"
};

// Resultado: Preferência criada no Mercado Pago e registro salvo na tabela payments
```

### 3. Cliente Paga no Mercado Pago
- Cliente é redirecionado para o checkout
- Realiza o pagamento
- Mercado Pago envia webhook

### 4. Webhook Processa o Pagamento

#### Pagamento Aprovado
```json
{
  "type": "payment",
  "data": {
    "id": "123456789"
  }
}
```

**Resultado:**
- ✅ Assinatura validada
- ✅ Status do pagamento consultado na API do Mercado Pago
- ✅ Se `status = "approved"`: agendamento muda para `"agendado"`
- ✅ Resposta: `200 OK`

#### Pagamento Rejeitado
```json
{
  "type": "payment", 
  "data": {
    "id": "123456789"
  }
}
```

**Resultado:**
- ✅ Assinatura validada
- ✅ Status do pagamento consultado na API do Mercado Pago
- ✅ Se `status = "rejected"`: `payment_status` muda para `"failed"`
- ✅ Horário fica livre novamente
- ✅ Resposta: `200 OK`

## Logs Esperados

### Pagamento Aprovado
```
🔔 Webhook recebido - Signature: abc123...
✅ Assinatura válida
🔔 Dados da notificação: { type: "payment", data: { id: "123456789" } }
💳 Processando pagamento ID: 123456789
✅ Pagamento encontrado no banco: payment-uuid
🔍 Buscando status do pagamento no Mercado Pago...
💳 Status do pagamento: approved
✅ Pagamento aprovado - Confirmando agendamento
✅ Agendamento confirmado com sucesso
```

### Pagamento Rejeitado
```
🔔 Webhook recebido - Signature: abc123...
✅ Assinatura válida
🔔 Dados da notificação: { type: "payment", data: { id: "123456789" } }
💳 Processando pagamento ID: 123456789
✅ Pagamento encontrado no banco: payment-uuid
🔍 Buscando status do pagamento no Mercado Pago...
💳 Status do pagamento: rejected
❌ Pagamento rejeitado/cancelado - Liberando horário
✅ Horário liberado - pagamento falhou
```

## Verificações de Segurança

### ✅ Validação de Assinatura
- Requisições sem header `x-signature` → 401 Unauthorized
- Assinaturas inválidas → 401 Unauthorized
- Assinaturas válidas → Processamento continua

### ✅ Configuração de Autenticação
- `export const config = { auth: false }` → Sem JWT obrigatório
- Webhook pode ser chamado pelo Mercado Pago sem autenticação

### ✅ Headers CORS
- `x-signature` incluído nos headers permitidos
- CORS configurado para aceitar requisições do Mercado Pago

## Monitoramento

### Logs Importantes
- ✅ Assinatura válida/inválida
- ✅ Status do pagamento consultado
- ✅ Agendamento confirmado/liberado
- ❌ Erros de validação ou processamento

### Métricas de Sucesso
- Taxa de webhooks processados com sucesso
- Tempo de resposta do webhook
- Taxa de pagamentos aprovados vs rejeitados
