# 🔧 CONFIGURAÇÃO CORRIGIDA DO WEBHOOK MERCADO PAGO

## 🚨 PROBLEMA IDENTIFICADO

O webhook do Mercado Pago não está funcionando porque:
- ❌ **Supabase está exigindo autenticação** mesmo com `auth: false`
- ❌ **Mercado Pago não consegue acessar o webhook** (erro 401)
- ❌ **Por isso não aparecem notificações** no painel do Mercado Pago

## ✅ SOLUÇÃO

### 1. Configurar Webhook no Mercado Pago

**URL do Webhook:**
```
https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook-public
```

**Eventos a configurar:**
- ✅ `payment` (Pagamentos)
- ✅ `payment.updated` (Atualizações de pagamento)

### 2. Testar o Webhook

Após configurar, faça um pagamento de teste e verifique:
- ✅ Se aparecem notificações no painel do Mercado Pago
- ✅ Se o webhook está sendo chamado

### 3. Verificar Configurações do Supabase

No painel do Supabase:
1. Vá para **"Edge Functions"**
2. Verifique se há configurações de segurança
3. Se necessário, desabilite autenticação global

## 🔍 COMO TESTAR

1. **Configure o webhook** com a nova URL
2. **Faça um pagamento de teste** (R$ 1,00)
3. **Verifique no painel do Mercado Pago** se aparecem notificações
4. **Se aparecerem notificações**, o problema está resolvido!

## 📋 PRÓXIMOS PASSOS

Se o webhook funcionar:
1. ✅ Mercado Pago enviará notificações
2. ✅ Webhook processará os pagamentos
3. ✅ Agendamentos serão criados automaticamente
4. ✅ Frontend detectará via polling/Realtime

---

**IMPORTANTE:** A tela "Database Webhooks" que você viu NÃO precisa ser configurada. Essa é para webhooks que o Supabase envia, não para receber do Mercado Pago.
