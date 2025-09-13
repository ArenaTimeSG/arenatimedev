# 🔧 Configuração do Token de Acesso do Mercado Pago

## 🚨 Problema Identificado

O webhook está configurado no painel do Mercado Pago, mas o **token de acesso não é válido**. O token atual `TEST-4b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b` está retornando erro 401 (Unauthorized).

## ✅ Solução: Configurar Token Válido

### **Passo 1: Obter Token de Acesso Válido**

#### **Para Ambiente de Teste:**
1. Acesse: https://www.mercadopago.com.br/developers
2. Faça login com sua conta
3. Vá para "Suas integrações"
4. Clique em "Criar aplicação" ou selecione uma existente
5. Copie o **Access Token** (começa com `TEST-`)

#### **Para Ambiente de Produção:**
1. No mesmo painel, vá para a aba "Produção"
2. Copie o **Access Token** (começa com `APP-`)

### **Passo 2: Configurar Token no Supabase**

Execute o comando abaixo substituindo `SEU_TOKEN_AQUI` pelo token real:

```bash
npx supabase secrets set MP_ACCESS_TOKEN=SEU_TOKEN_AQUI
```

**Exemplo:**
```bash
npx supabase secrets set MP_ACCESS_TOKEN=TEST-12345678-1234-1234-1234-123456789012
```

### **Passo 3: Fazer Redeploy da Função**

```bash
npx supabase functions deploy mercado-pago-webhook
```

### **Passo 4: Testar o Token**

Após configurar o token, teste se está funcionando:

```bash
node test-webhook-real-simulation.js
```

## 🔍 Como Identificar o Token Correto

### **Token de Teste (Sandbox):**
- ✅ Começa com `TEST-`
- ✅ Usado para desenvolvimento e testes
- ✅ Não processa pagamentos reais

### **Token de Produção:**
- ✅ Começa com `APP-`
- ✅ Usado para pagamentos reais
- ✅ Processa pagamentos de verdade

### **Token Inválido (Atual):**
- ❌ `TEST-4b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b`
- ❌ Token de exemplo/placeholder
- ❌ Não funciona com a API do Mercado Pago

## 🧪 Teste do Token

### **Teste 1: Verificar se Token é Válido**
```bash
curl -X GET "https://api.mercadopago.com/v1/payments/123456789" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
- ✅ **200**: Token válido
- ❌ **401**: Token inválido

### **Teste 2: Verificar Webhook**
Após configurar o token correto, o webhook deve funcionar:
- ✅ **200**: Webhook funcionando
- ❌ **500**: Token ainda inválido

## 📋 URLs Importantes

### **Painel do Mercado Pago:**
```
https://www.mercadopago.com.br/developers
```

### **API do Mercado Pago:**
```
https://api.mercadopago.com/v1/payments/{id}
```

### **Webhook:**
```
https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook
```

## 🎯 Próximos Passos

### **1. Obter Token Válido (URGENTE)**
- Acesse o painel do Mercado Pago
- Copie o Access Token real
- Configure no Supabase

### **2. Configurar no Supabase**
```bash
npx supabase secrets set MP_ACCESS_TOKEN=SEU_TOKEN_REAL
```

### **3. Fazer Redeploy**
```bash
npx supabase functions deploy mercado-pago-webhook
```

### **4. Testar Sistema**
- Faça um pagamento de teste
- Verifique se o webhook é chamado
- Confirme se o agendamento é criado

## ⚠️ Importante

**Sem token válido:**
- ❌ Webhook retorna erro 500
- ❌ Pagamentos não são processados
- ❌ Agendamentos não são criados

**Com token válido:**
- ✅ Webhook funciona perfeitamente
- ✅ Pagamentos são processados
- ✅ Agendamentos são criados automaticamente

## 🚀 Resumo

O problema é que o **token de acesso não é válido**. Você precisa:

1. **Obter token real** no painel do Mercado Pago
2. **Configurar no Supabase** com o comando `secrets set`
3. **Fazer redeploy** da função webhook
4. **Testar o sistema** com pagamento real

Depois disso, tudo funcionará perfeitamente! 🎉
