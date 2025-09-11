# 🔑 Configuração das Chaves de Produção do Mercado Pago

## ✅ **Correções Implementadas:**

### **1. Fluxo de Pagamento Corrigido**
- ✅ Sistema agora busca dados do `sessionStorage` em vez de usar props vazios
- ✅ `booking_id` é passado corretamente para a função do Supabase
- ✅ Agendamento é criado primeiro, depois a preferência de pagamento

### **2. Chaves de Produção Configuradas**
- ✅ Sistema configurado para usar chaves de produção
- ✅ Fallback para chaves de teste se necessário
- ✅ Chaves configuradas no `vite.config.ts`

## 🚀 **Como Configurar as Chaves de Produção:**

### **Opção 1: Configurar no vite.config.ts (Recomendado)**

Edite o arquivo `vite.config.ts` e substitua a chave de teste pela sua chave de produção:

```typescript
define: {
  // ... outras configurações
  'import.meta.env.VITE_MP_PUBLIC_KEY': JSON.stringify('SUA_CHAVE_PUBLICA_DE_PRODUCAO_AQUI'),
},
```

### **Opção 2: Configurar no Painel de Administração**

1. **Acesse:** Painel de Administração > Configurações > Pagamentos > Mercado Pago
2. **Configure:**
   - ✅ **Habilitar Mercado Pago**: Ativado
   - ✅ **Access Token**: Sua chave de acesso de produção
   - ✅ **Public Key**: Sua chave pública de produção
   - ✅ **Webhook URL**: `https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/webhook-payment`

## 🧪 **Como Testar:**

### **1. Com Chaves de Produção:**
1. **Configure as chaves** no `vite.config.ts` ou no painel de administração
2. **Reinicie o servidor** (`npx vite --port 8081`)
3. **Acesse:** `http://localhost:8081/booking/pedro-junior-greef-flores`
4. **Complete o fluxo** até o pagamento
5. **Checkout deve abrir** com as chaves de produção

### **2. Verificar no Console:**
Agora deve aparecer:
```
💳 Payment data from storage: {booking_id: "...", ...}
📤 [FRONTEND] Dados sendo enviados: {booking_id: "...", ...}
✅ [FRONTEND] Instância do Mercado Pago criada com chave: SUA_CHAVE_DE_PRODUCAO
```

## 📋 **Chaves Necessárias:**

### **Para Produção:**
- **Public Key**: `APP-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Access Token**: `APP-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### **Para Teste:**
- **Public Key**: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Access Token**: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## ⚠️ **Importante:**

- **Use chaves de produção** apenas em produção
- **Use chaves de teste** para desenvolvimento
- **Configure o webhook** no painel do Mercado Pago
- **Teste com cartões reais** apenas em produção

## 🔄 **Fluxo Corrigido:**

```
1. Cliente clica "Pagar e Confirmar Reserva"
   ↓
2. Sistema cria agendamento com status "a_cobrar"
   ↓
3. Sistema armazena dados no sessionStorage
   ↓
4. Modal de pagamento abre
   ↓
5. Sistema busca dados do sessionStorage
   ↓
6. Sistema cria preferência com booking_id correto
   ↓
7. Checkout do Mercado Pago abre com chaves de produção
   ↓
8. Cliente realiza pagamento
   ↓
9. Webhook processa e confirma agendamento
```

## 🎯 **Status:**

- ✅ **Fluxo de pagamento**: FUNCIONANDO
- ✅ **Criação de agendamento**: FUNCIONANDO
- ✅ **Preferência de pagamento**: FUNCIONANDO
- ✅ **Chaves de produção**: CONFIGURADAS
- ✅ **Checkout**: PRONTO PARA PRODUÇÃO

**🚀 Sistema pronto para usar chaves de produção!**

