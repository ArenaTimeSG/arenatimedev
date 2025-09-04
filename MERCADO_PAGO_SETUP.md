# Configuração do Mercado Pago

## Variáveis de Ambiente Necessárias

Para que o sistema de pagamento funcione, você precisa configurar as seguintes variáveis de ambiente no Supabase:

### 1. No Painel do Supabase
Acesse: **Settings > Edge Functions > Environment Variables**

Adicione as seguintes variáveis:

```
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_aqui
SITE_URL=https://seu-dominio.com
```

### 2. Como Obter o Access Token do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Faça login na sua conta
3. Vá para **Suas integrações**
4. Selecione sua aplicação ou crie uma nova
5. Copie o **Access Token** (não o Public Key)

### 3. Configuração do Webhook

No painel do Mercado Pago:
1. Vá para **Webhooks**
2. Adicione a URL: `https://seu-projeto.supabase.co/functions/v1/mercado-pago-webhook`
3. Selecione os eventos: `payment`

### 4. URLs de Retorno

Configure as seguintes URLs no Mercado Pago:
- **Success**: `https://seu-dominio.com/payment/success`
- **Failure**: `https://seu-dominio.com/payment/failure`
- **Pending**: `https://seu-dominio.com/payment/pending`

### 5. Testando o Sistema

Para testar em modo sandbox:
1. Use o Access Token de teste (TEST-xxx)
2. Use cartões de teste do Mercado Pago
3. Verifique os logs no Supabase Edge Functions

### 6. Cartões de Teste

**Aprovado:**
- Número: 4111 1111 1111 1111
- CVV: 123
- Vencimento: Qualquer data futura

**Rejeitado:**
- Número: 4000 0000 0000 0002
- CVV: 123
- Vencimento: Qualquer data futura

## Estrutura do Sistema

### Fluxo de Pagamento:
1. Cliente escolhe pagar no agendamento
2. Sistema cria preferência no Mercado Pago
3. Cliente é redirecionado para o checkout
4. Após pagamento, webhook atualiza status
5. Agendamento é marcado como "pago"

### Status dos Agendamentos:
- **sem_pagamento**: Agendamento normal, sem necessidade de pagamento
- **obrigatorio**: Cliente deve pagar para confirmar
- **opcional**: Cliente pode escolher pagar ou não

### Status de Pagamento:
- **not_required**: Não precisa de pagamento
- **pending**: Pagamento pendente
- **failed**: Pagamento falhou
- **pago**: Agendamento pago (status principal)
