# 🚨 CONFIGURAR WEBHOOK DO MERCADO PAGO AGORA

## 📋 PASSOS PARA CONFIGURAR

### 1. Acesse o Painel do Mercado Pago
- Vá para: https://www.mercadopago.com.br/developers/panel
- Faça login com sua conta

### 2. Configure o Webhook
- Vá para a seção **"Webhooks"**
- Clique em **"Configurar notificações"** (botão azul)
- **URL do Webhook:**
  ```
  https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook-public
  ```
- **Eventos a selecionar:**
  - ✅ `payment` (Pagamentos)
  - ✅ `payment.updated` (Atualizações de pagamento)

### 3. Salve a Configuração
- Clique em **"Salvar"** ou **"Confirmar"**

### 4. Teste o Webhook
- Faça um pagamento de teste (R$ 1,00)
- Verifique se aparecem notificações no painel do Mercado Pago
- Se aparecerem, o webhook está funcionando!

## 🔍 COMO VERIFICAR SE FUNCIONOU

1. **No painel do Mercado Pago:**
   - Vá para "Webhooks" > "Notificações"
   - Deve aparecer "100% Notificações entregues" (ou similar)
   - Deve aparecer uma lista de notificações enviadas

2. **No console do navegador:**
   - Deve parar de aparecer erros 404
   - O polling deve funcionar corretamente

## ⚠️ IMPORTANTE

- **Use a URL exata:** `mercado-pago-webhook-public` (não a antiga)
- **Selecione os eventos corretos:** `payment` e `payment.updated`
- **Teste imediatamente** após configurar

---

**Depois de configurar, me avise se aparecem notificações no painel do Mercado Pago!**
