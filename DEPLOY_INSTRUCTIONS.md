# 🚀 Instruções para Deploy Manual da Função de Pagamento

## 📋 O que foi corrigido:

1. **Removida simulação automática** de pagamento
2. **Configurado para usar chaves de produção** do Mercado Pago
3. **Fluxo correto**: Agendamento só é criado APÓS pagamento confirmado

## 🔧 Como fazer o deploy:

### 1. Acesse o Dashboard do Supabase:
- Vá para: https://supabase.com/dashboard/project/xtufbfvrgpzqbvdfmtiy
- Clique em **"Edge Functions"** no menu lateral

### 2. Edite a função `create-payment-preference`:
- Clique na função `create-payment-preference`
- Clique em **"Edit"**

### 3. Substitua o código pelo código corrigido:
- Copie todo o conteúdo do arquivo `create-payment-preference-fixed.ts`
- Cole no editor
- Clique em **"Deploy"**

## ✅ Verificações necessárias:

### 1. Configurações do Mercado Pago:
- Vá para **Configurações > Pagamentos**
- Verifique se o **Access Token de PRODUÇÃO** está configurado
- Verifique se o **Mercado Pago está habilitado**

### 2. Política de Pagamento:
- Configure a política como **"Obrigatório"** para testar
- Isso garantirá que o agendamento só seja criado após pagamento

## 🎯 Fluxo esperado após correção:

1. **Usuário clica "Pagar e Agendar"**
2. **Modal de pagamento abre**
3. **Checkout do Mercado Pago abre** (janela real)
4. **Usuário completa o pagamento**
5. **APENAS APÓS pagamento confirmado**, o agendamento é criado
6. **Tela de sucesso é exibida**

## 🧪 Para testar:

1. **Recarregue a página** (Ctrl+F5)
2. **Faça um agendamento** com política "Obrigatório"
3. **O checkout deve abrir** e permanecer aberto
4. **Complete o pagamento** no Mercado Pago
5. **Agendamento deve ser criado** apenas após confirmação

## ❌ O que NÃO deve acontecer:

- ❌ Modal fechar automaticamente
- ❌ Agendamento ser criado sem pagamento
- ❌ Simulação de pagamento
- ❌ URLs mock

## 🔍 Se ainda houver problemas:

1. **Verifique o console** do navegador para erros
2. **Verifique as configurações** do Mercado Pago
3. **Teste com política "Obrigatório"**
4. **Verifique se as chaves são de produção**
