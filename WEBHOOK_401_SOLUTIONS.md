# Soluções para Erro 401 no Webhook

## Problema Identificado
O webhook está retornando erro 401 mesmo com `auth: false` configurado. O Supabase está rejeitando a requisição antes do código ser executado.

## Soluções Possíveis

### 1. Configuração do Projeto Supabase
O projeto pode ter configurações que forçam autenticação globalmente.

**Verificar:**
- Configurações de RLS (Row Level Security)
- Configurações de autenticação global
- Configurações de CORS

### 2. Configuração do Mercado Pago
O Mercado Pago pode precisar enviar headers de autenticação.

**Solução:**
- Configurar o Mercado Pago para enviar a chave `anon` no header `apikey`
- Configurar o Mercado Pago para enviar um token de autenticação

### 3. Alternativa - Usar Outro Endpoint
Criar um endpoint alternativo sem autenticação.

**Opções:**
- Usar um serviço de webhook externo
- Usar um endpoint HTTP simples
- Usar um gateway de API

### 4. Configuração do Edge Function
Modificar a configuração do Edge Function.

**Tentar:**
- Remover completamente a linha de configuração
- Usar autenticação opcional
- Processar a autenticação manualmente

### 5. Verificar Configurações do Supabase
Verificar se há configurações que forçam autenticação.

**Verificar:**
- Settings > API
- Settings > Database
- Settings > Auth
- Settings > Edge Functions

## Recomendações

1. **Verificar configurações do projeto Supabase**
2. **Contatar suporte do Supabase**
3. **Considerar usar um serviço de webhook externo**
4. **Testar com diferentes configurações**

## Status Atual
- ❌ Erro 401 persiste
- ❌ `auth: false` não está funcionando
- ❌ Mercado Pago não consegue entregar notificações
- ✅ Logs mostram requisições chegando
- ✅ Código do webhook está correto
