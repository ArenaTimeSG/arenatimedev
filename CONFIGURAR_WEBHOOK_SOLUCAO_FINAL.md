# 🚨 SOLUÇÃO FINAL PARA O WEBHOOK

## 🔍 PROBLEMA IDENTIFICADO

O Supabase está forçando autenticação em **TODAS** as Edge Functions, mesmo com:
- `auth: false`
- `verifyJWT: false`

Isso significa que há uma configuração global no projeto que está bloqueando acesso público.

## ✅ SOLUÇÕES POSSÍVEIS

### 1. Verificar Configurações do Projeto Supabase

No painel do Supabase:
1. Vá para **"Settings"** > **"API"**
2. Verifique se há configurações de segurança que estão bloqueando acesso público
3. Procure por configurações como "Require authentication" ou similar

### 2. Usar Webhook com Autenticação

Se não conseguir desabilitar a autenticação global, use este webhook:

**URL do Webhook:**
```
https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook-auth
```

**Headers necessários:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M
Content-Type: application/json
```

### 3. Configurar no Mercado Pago

No painel do Mercado Pago:
1. Vá para **"Webhooks"**
2. Configure a URL: `mercado-pago-webhook-auth`
3. **IMPORTANTE:** Adicione o header de autorização
4. Selecione os eventos: `payment` e `payment.updated`

## 🔧 CONFIGURAÇÃO ALTERNATIVA

Se o Mercado Pago não permitir headers customizados, você pode:

1. **Usar um serviço intermediário** (como ngrok ou similar)
2. **Configurar um proxy** que adiciona a autenticação
3. **Verificar se há configurações de segurança** no projeto Supabase

## 📋 PRÓXIMOS PASSOS

1. **Verifique as configurações do projeto Supabase**
2. **Se não conseguir desabilitar autenticação global, use o webhook com auth**
3. **Teste novamente no painel do Mercado Pago**

---

**O problema é que o Supabase está forçando autenticação globalmente. Precisamos resolver isso primeiro.**
