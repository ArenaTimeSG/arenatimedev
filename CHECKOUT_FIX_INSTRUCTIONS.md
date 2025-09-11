# 🔧 Instruções para Corrigir o Checkout de Pagamentos

## ❌ **Problemas Identificados:**

1. **Fluxo de Pagamento Inconsistente** 
2. **Configuração do Mercado Pago Individual por Administrador**
3. **Falta de Criação de Agendamento Antes do Checkout**

## ✅ **Correções Implementadas:**

### 1. **Fluxo de Pagamento Corrigido**
- ✅ Agora o sistema cria o agendamento **ANTES** de abrir o checkout
- ✅ O agendamento é criado com status "pending" 
- ✅ O webhook atualiza o status para "pago" quando o pagamento é aprovado

### 2. **Sistema de Configuração Individual**
- ✅ Cada administrador configura suas próprias chaves do Mercado Pago
- ✅ As chaves são armazenadas na tabela `settings` do banco de dados
- ✅ O sistema busca automaticamente as configurações do administrador logado

## 🚀 **Passos para Completar a Correção:**

### **Passo 1: Configurar Mercado Pago no Painel de Administração**

1. **Faça login como administrador** no painel de configurações
2. **Vá para Configurações > Pagamentos > Mercado Pago**
3. **Configure as seguintes informações:**
   - ✅ **Habilitar Mercado Pago**: Marque como ativado
   - ✅ **Access Token**: Cole seu access token do Mercado Pago
   - ✅ **Public Key**: Cole sua chave pública do Mercado Pago
   - ✅ **Webhook URL**: `https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/webhook-payment`

### **Passo 2: Obter Chaves do Mercado Pago**

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Faça login na sua conta
3. Vá para **Suas integrações**
4. Copie:
   - **Public Key** (para o campo Public Key)
   - **Access Token** (para o campo Access Token)

### **Passo 3: Configurar Webhook no Mercado Pago**

1. No painel do Mercado Pago, vá para **Webhooks**
2. Adicione a URL: `https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/webhook-payment`
3. Selecione os eventos: `payment`

## 🧪 **Como Testar:**

### **1. Verificar Configuração:**
- ✅ Acesse o painel de administração
- ✅ Vá para Configurações > Pagamentos > Mercado Pago
- ✅ Verifique se está habilitado e as chaves estão preenchidas

### **2. Teste com Cartão de Teste:**
- **Número:** 4111 1111 1111 1111
- **CVV:** 123
- **Vencimento:** Qualquer data futura

### **3. Verificar Logs:**
Abra o console do navegador e verifique se aparecem:
```
🔍 OnlineBooking: Processando pagamento - criando agendamento primeiro
✅ Agendamento criado com sucesso: [ID]
✅ Payment data stored in sessionStorage
🚀 [FRONTEND] Criando preferência de pagamento...
✅ [FRONTEND] SDK do Mercado Pago disponível
```

### **4. Verificar no Supabase:**
- Tabela `appointments`: deve ter um registro com status "pending"
- Tabela `payments`: deve ser criada quando o pagamento for aprovado
- Tabela `settings`: deve ter as configurações do Mercado Pago do administrador

## 🔄 **Fluxo Corrigido:**

```
1. Cliente clica "Pagar e Confirmar Reserva"
   ↓
2. Sistema cria agendamento com status "pending"
   ↓
3. Sistema cria preferência de pagamento no Mercado Pago
   ↓
4. Cliente é redirecionado para o checkout
   ↓
5. Cliente realiza o pagamento
   ↓
6. Mercado Pago chama o webhook automaticamente
   ↓
7. Webhook atualiza agendamento para status "pago"
   ↓
8. Agendamento confirmado! ✅
```

## ⚠️ **Importante:**

- **Configure as chaves no painel de administração** (não em arquivos .env)
- **Use cartões de teste** para desenvolvimento
- **Verifique os logs** no console e no Supabase Functions
- **Configure o webhook** no painel do Mercado Pago
- **Cada administrador deve configurar suas próprias chaves**

## 🆘 **Se Ainda Não Funcionar:**

1. Verifique se as configurações do Mercado Pago estão preenchidas no painel de administração
2. Verifique se o Mercado Pago está habilitado nas configurações
3. Verifique se as chaves do Mercado Pago estão corretas
4. Verifique se o webhook está configurado no Mercado Pago
5. Verifique os logs no console do navegador
6. Verifique os logs no Supabase Functions
7. Verifique se o administrador está logado corretamente

## 📞 **Suporte:**

Se precisar de ajuda adicional, verifique:
- Logs do console do navegador
- Logs do Supabase Functions
- Status do webhook no painel do Mercado Pago
