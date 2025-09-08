# Troubleshooting - Webhook 401 Error

## Problema
O webhook do Mercado Pago está retornando erro 401 (Unauthorized) mesmo com `auth: false` configurado.

## Possíveis Causas e Soluções

### 1. Configuração do Projeto Supabase
O projeto pode ter configurações que forçam autenticação globalmente.

**Verificar:**
- Configurações de RLS (Row Level Security)
- Configurações de autenticação global
- Configurações de CORS

### 2. URL do Webhook no Mercado Pago
Verificar se a URL está correta no painel do Mercado Pago.

**URL Atual:** `https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook`

### 3. Headers Necessários
O Supabase pode estar esperando headers específicos.

**Tentar adicionar:**
- `apikey` header com a chave pública do Supabase
- `Authorization` header com Bearer token
- Headers específicos do Mercado Pago

### 4. Configuração do Edge Function
O `auth: false` pode não estar funcionando corretamente.

**Alternativas:**
- Remover completamente a linha de configuração
- Usar autenticação opcional
- Processar a autenticação manualmente

### 5. Teste Manual
Testar o webhook manualmente para verificar se está funcionando.

**Comando de teste:**
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "apikey" = "SUA_CHAVE_PUBLICA_SUPABASE"
}
$body = '{"test": "webhook"}'
Invoke-WebRequest -Uri "https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook" -Method POST -Headers $headers -Body $body
```

### 6. Verificar Logs do Supabase
Verificar os logs no painel do Supabase para entender o erro.

**Dashboard:** https://supabase.com/dashboard/project/xtufbfvrgpzqbvdfmtiy/functions

### 7. Alternativa - Usar Outro Endpoint
Criar um endpoint alternativo sem autenticação.

### 8. Configuração do Mercado Pago
Verificar se o Mercado Pago está enviando as requisições corretamente.

**Verificar:**
- Headers enviados pelo Mercado Pago
- Formato do corpo da requisição
- Método HTTP utilizado

## Próximos Passos Recomendados

1. **Verificar logs no painel do Supabase**
2. **Testar com apikey no header**
3. **Verificar configurações do projeto**
4. **Contatar suporte do Supabase se necessário**

## Status Atual
- ✅ Webhook deployado com sucesso
- ✅ URL correta configurada no Mercado Pago
- ❌ Retornando 401 mesmo com auth: false
- ❌ Mercado Pago não consegue entregar notificações
