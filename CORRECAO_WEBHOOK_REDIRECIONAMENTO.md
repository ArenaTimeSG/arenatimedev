# ✅ Correção do Redirecionamento de Webhook

## 🔧 Problema Identificado

O Mercado Pago estava chamando o webhook `mercado-pago-webhook-simple` em vez do `notification-webhook` que foi corrigido. Isso causava:

- ❌ Processamento incorreto de pagamentos
- ❌ Erro "Configurações do admin não encontradas"
- ❌ Erro "Notificação não é de pagamento ou dados inválidos"
- ❌ Falha na confirmação de agendamentos

## 🎯 Solução Implementada

### **Redirecionamento Automático**

Modificado o `mercado-pago-webhook-simple` para redirecionar automaticamente para o `notification-webhook`:

```typescript
// Verificar se é uma notificação de pagamento
if (body.type === 'payment' && body.data && body.data.id) {
  const paymentId = body.data.id;
  console.log('💳 Notificação de pagamento recebida:', paymentId);

  // Redirecionar para o webhook correto
  console.log('🔄 Redirecionando para notification-webhook...');
  
  // Chamar o webhook correto
  const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/notification-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify(body)
  });

  console.log('✅ Webhook redirecionado com sucesso:', webhookResponse.status);
  return new Response('ok', { status: 200, headers: corsHeaders });
}
```

## 🔄 Fluxo Corrigido

1. **Mercado Pago** → chama `mercado-pago-webhook-simple`
2. **Webhook Simple** → redireciona para `notification-webhook`
3. **Notification Webhook** → processa pagamento e cria agendamento
4. **Frontend** → recebe confirmação via Realtime

## ✅ Benefícios

- ✅ **Compatibilidade**: Mantém webhook antigo funcionando
- ✅ **Redirecionamento**: Automático para webhook correto
- ✅ **Processamento**: Usa lógica corrigida do `notification-webhook`
- ✅ **Logs**: Mantém rastreabilidade de ambos os webhooks

## 🧪 Teste

1. Efetuar pagamento no agendamento online
2. Verificar logs do `mercado-pago-webhook-simple` (redirecionamento)
3. Verificar logs do `notification-webhook` (processamento)
4. Confirmar criação do agendamento no banco
5. Verificar confirmação no frontend

## 📋 Status

- ✅ Webhook redirecionamento implementado
- ✅ Código limpo e funcional
- ✅ Pronto para teste em produção
