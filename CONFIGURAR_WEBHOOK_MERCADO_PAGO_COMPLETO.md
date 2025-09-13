# 🔧 Configuração Completa do Webhook no Mercado Pago

## 🚨 Problema Identificado

O webhook não está sendo chamado pelo Mercado Pago porque **não está configurado no painel de desenvolvedores**. Por isso não aparecem notificações e o agendamento não é criado automaticamente.

## ✅ Solução: Configurar Webhook no Mercado Pago

### **Passo 1: Acessar o Painel de Desenvolvedores**

1. **Acesse:** https://www.mercadopago.com.br/developers
2. **Faça login** com sua conta do Mercado Pago
3. **Vá para "Suas integrações"** ou "Minhas integrações"

### **Passo 2: Encontrar a Seção de Webhooks**

1. **Procure por "Webhooks"** ou "Notificações"
2. **Clique em "Configurar webhook"** ou "Adicionar webhook"
3. **Se não encontrar, procure por "Notificações IPN"**

### **Passo 3: Configurar o Webhook**

#### **URL do Webhook:**
```
https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook
```

#### **Eventos para Escutar:**
- ✅ **`payment`** (pagamentos)
- ✅ **`payment.created`** (pagamento criado)
- ✅ **`payment.updated`** (pagamento atualizado)
- ✅ **`payment.approved`** (pagamento aprovado)
ee
#### **Configurações:**
- ✅ **Ativar webhook**
- ✅ **Usar HTTPS**
- ✅ **Incluir headers de autenticação**

### **Passo 4: Testar o Webhook**

1. **Salve a configuração**
2. **Faça um pagamento de teste**
3. **Verifique se aparecem notificações** no painel
4. **Confirme se o agendamento é criado** automaticamente

## 🧪 Como Testar se o Webhook Está Funcionando

### **Teste 1: Verificar no Painel do Mercado Pago**
1. Acesse o painel de desenvolvedores
2. Vá para a seção de webhooks
3. Verifique se há **logs de notificações**
4. Confirme se o status está **"Ativo"**

### **Teste 2: Fazer Pagamento de Teste**
1. Acesse o agendamento online
2. Complete um pagamento de **R$ 1,00**
3. Verifique se o webhook é chamado
4. Confirme se o agendamento é criado

### **Teste 3: Verificar Logs do Supabase**
1. Acesse: https://supabase.com/dashboard/project/xtufbfvrgpzqbvdfmtiy/functions
2. Vá para a função `mercado-pago-webhook`
3. Verifique os **logs de execução**
4. Confirme se há requisições recebidas

## 🔍 Troubleshooting

### **Se o webhook não aparecer no painel:**
1. **Verifique se está logado** na conta correta
2. **Procure por "Notificações IPN"** em vez de "Webhooks"
3. **Verifique se a conta tem permissões** de desenvolvedor
4. **Tente acessar via:** https://www.mercadopago.com.br/developers/panel

### **Se o webhook não for chamado:**
1. **Verifique se a URL está correta**
2. **Confirme se está usando HTTPS**
3. **Teste se a URL está acessível**
4. **Verifique se não há firewall bloqueando**

### **Se aparecer erro 404:**
1. **Confirme se a função está deployada**
2. **Verifique se o nome da função está correto**
3. **Teste a URL diretamente no navegador**

## 📋 URLs Importantes

### **Webhook Principal:**
```
https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook
```

### **Webhook de Teste (simplificado):**
```
https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/check-payment-status-simple
```

### **Painel do Mercado Pago:**
```
https://www.mercadopago.com.br/developers
```

### **Logs do Supabase:**
```
https://supabase.com/dashboard/project/xtufbfvrgpzqbvdfmtiy/functions
```

## 🎯 Próximos Passos

### **1. Configurar Webhook (URGENTE)**
- Acesse o painel do Mercado Pago
- Configure o webhook com a URL correta
- Ative os eventos de pagamento

### **2. Testar Configuração**
- Faça um pagamento de teste
- Verifique se aparecem notificações
- Confirme se o agendamento é criado

### **3. Monitorar Logs**
- Verifique os logs do webhook
- Confirme se as requisições estão chegando
- Ajuste configurações se necessário

## ⚠️ Importante

**Sem o webhook configurado no Mercado Pago:**
- ❌ Pagamentos não são processados automaticamente
- ❌ Agendamentos não são criados
- ❌ Sistema não funciona corretamente

**Com o webhook configurado:**
- ✅ Pagamentos são processados automaticamente
- ✅ Agendamentos são criados instantaneamente
- ✅ Sistema funciona perfeitamente

## 🚀 Resumo

O problema é que **o webhook não está configurado no painel do Mercado Pago**. Você precisa:

1. **Acessar o painel de desenvolvedores**
2. **Configurar o webhook** com a URL correta
3. **Ativar os eventos de pagamento**
4. **Testar com um pagamento real**

Depois disso, o sistema funcionará perfeitamente! 🎉
