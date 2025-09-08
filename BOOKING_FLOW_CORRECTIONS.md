# Correções no Fluxo de Agendamento - ArenaTime

## Problema Identificado

O sistema estava criando agendamentos no frontend antes do pagamento ser aprovado, causando:
- Agendamentos "pendentes" ocupando horários
- Inconsistência entre status de pagamento e agendamento
- Possibilidade de agendamentos confirmados sem pagamento

## Solução Implementada

### 🎯 **Princípio Central:**
**Agendamentos só são criados no backend (webhook) quando o pagamento é aprovado.**

## Correções Implementadas

### 1. Frontend - OnlineBooking.tsx

**Antes:**
```typescript
// Criava agendamento com status 'pending' antes do pagamento
await createAppointment('pending');
```

**Depois:**
```typescript
// Apenas processa pagamento, não cria agendamento
const handleProcessPayment = async () => {
  const paymentData = {
    user_id: adminData.user.user_id,
    amount: reserva.modalidade.valor,
    description: `Agendamento - ${reserva.modalidade.name}`,
    client_name: client.name,
    client_email: client.email,
    appointment_data: {
      client_id: client.id,
      date: dataHora.toISOString(),
      modality: reserva.modalidade.name,
      valor_total: reserva.modalidade.valor,
      payment_policy: adminData.settings.payment_policy
    }
  };
  
  sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
  setStep(6); // Ir para checkout
};
```

### 2. Frontend - PaymentCheckout.tsx

**Antes:**
```typescript
// Passava appointment_id para criar agendamento
const paymentData = {
  appointment_id: appointmentId
};
```

**Depois:**
```typescript
// Busca dados do sessionStorage e não passa appointment_id
const storedPaymentData = sessionStorage.getItem('paymentData');
const paymentData = JSON.parse(storedPaymentData);

const paymentPreferenceData = {
  user_id: paymentData.user_id,
  amount: paymentData.amount,
  description: paymentData.description,
  client_name: paymentData.client_name,
  client_email: paymentData.client_email,
  appointment_data: paymentData.appointment_data // Dados para webhook criar depois
};
```

### 3. Backend - create-payment-preference

**Novo Campo:**
```typescript
interface PaymentRequest {
  appointment_data?: {
    client_id: string;
    date: string;
    modality: string;
    valor_total: number;
    payment_policy: string;
  };
}
```

**Lógica Atualizada:**
```typescript
// Salva dados do agendamento para webhook processar depois
if (appointment_data) {
  await supabase.from('payments').insert({
    appointment_id: null, // Será criado pelo webhook
    amount,
    currency: 'BRL',
    status: 'pending',
    mercado_pago_id: preference.id,
    payment_method: 'mercado_pago',
    appointment_data: JSON.stringify(appointment_data)
  });
}
```

### 4. Backend - mercado-pago-webhook

**Criação de Agendamento:**
```typescript
if (payment.status === "approved") {
  // Se não há appointment_id, criar o agendamento
  if (!paymentData.appointment_id && paymentData.appointment_data) {
    const appointmentData = JSON.parse(paymentData.appointment_data);
    
    // Criar o agendamento já como confirmado
    const { data: newAppointment } = await supabase
      .from('appointments')
      .insert({
        user_id: paymentData.appointments.user_id,
        client_id: appointmentData.client_id,
        date: appointmentData.date,
        status: 'agendado', // Criar já como confirmado
        modality: appointmentData.modality,
        valor_total: appointmentData.valor_total,
        payment_status: 'not_required',
        booking_source: 'online'
      })
      .select()
      .single();

    // Vincular pagamento ao agendamento criado
    await supabase
      .from('payments')
      .update({ appointment_id: newAppointment.id })
      .eq('id', paymentData.id);
  }
}
```

### 5. Mensagem de Processamento

**Frontend Atualizado:**
```typescript
<p className="text-slate-600 text-sm sm:text-base">
  Estamos processando seu pagamento. Seu agendamento será confirmado automaticamente assim que o pagamento for aprovado.
</p>
```

## Migração do Banco de Dados

### Nova Coluna na Tabela `payments`:
```sql
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS appointment_data TEXT;

COMMENT ON COLUMN public.payments.appointment_data IS 'Dados do agendamento em JSON para criação pelo webhook quando appointment_id é null';
```

## Fluxo Corrigido

### Para Pagamento Obrigatório:

1. **Cliente preenche dados** → Frontend valida informações
2. **Cliente clica "Pagar"** → Frontend armazena dados no sessionStorage
3. **Sistema abre checkout** → Mercado Pago cria preferência de pagamento
4. **Cliente paga** → Mercado Pago processa pagamento
5. **Webhook recebe notificação** → Valida assinatura e consulta status
6. **Se aprovado** → Webhook cria agendamento com status "agendado"
7. **Se rejeitado** → Nenhum agendamento é criado, horário fica livre

### Para Reservas Sem Pagamento:

1. **Cliente preenche dados** → Frontend valida informações
2. **Cliente clica "Confirmar"** → Frontend cria agendamento diretamente
3. **Agendamento criado** → Status baseado na configuração de auto-confirmação

## Benefícios da Correção

### ✅ **Segurança:**
- Nenhum agendamento é criado sem pagamento aprovado
- Horários não ficam ocupados por pagamentos pendentes
- Validação de assinatura HMAC-SHA256 no webhook

### ✅ **Consistência:**
- Status do agendamento sempre reflete o status do pagamento
- Sincronização automática via webhook
- Dados sempre consistentes entre frontend e backend

### ✅ **Experiência do Usuário:**
- Mensagem clara sobre processamento do pagamento
- Feedback imediato após pagamento
- Atualização automática da lista de agendamentos

### ✅ **Manutenibilidade:**
- Lógica centralizada no webhook
- Separação clara entre frontend e backend
- Código mais limpo e organizado

## Testes Recomendados

### 1. **Teste Pagamento Aprovado:**
- Fazer agendamento com pagamento obrigatório
- Simular pagamento aprovado
- Verificar se agendamento é criado com status "agendado"

### 2. **Teste Pagamento Rejeitado:**
- Fazer agendamento com pagamento obrigatório
- Simular pagamento rejeitado
- Verificar se nenhum agendamento é criado

### 3. **Teste Reserva Sem Pagamento:**
- Fazer agendamento sem pagamento obrigatório
- Verificar se agendamento é criado normalmente

### 4. **Teste Validação de Assinatura:**
- Enviar webhook com assinatura inválida
- Verificar se retorna 401 Unauthorized

## Arquivos Modificados

1. **`src/pages/OnlineBooking.tsx`** - Removida criação de agendamento para pagamentos
2. **`src/components/booking/PaymentCheckout.tsx`** - Atualizado para usar dados do sessionStorage
3. **`supabase/functions/create-payment-preference/index.ts`** - Adicionado suporte a appointment_data
4. **`supabase/functions/mercado-pago-webhook/index.ts`** - Implementada criação de agendamento
5. **`add_appointment_data_column.sql`** - Script de migração para nova coluna

## Resultado Final

O sistema agora garante que:
- ✅ **Nenhum agendamento é criado sem pagamento aprovado**
- ✅ **Horários não ficam ocupados por pagamentos pendentes**
- ✅ **Webhook cria agendamentos apenas quando pagamento é aprovado**
- ✅ **Frontend mostra mensagem clara sobre processamento**
- ✅ **Sistema mantém consistência entre pagamento e agendamento**
