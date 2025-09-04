# Implementação da Política de Pagamento (payment_policy)

## Resumo

Foi implementado suporte completo para a coluna `payment_policy` no backend, permitindo que administradores configurem como os clientes devem pagar pelos agendamentos online.

## Funcionalidades Implementadas

### 1. Backend/Database
- ✅ Coluna `payment_policy` já existe na tabela `settings` (migração: `20250126000000_add_payment_policy_to_settings.sql`)
- ✅ Validação no banco: apenas valores `'sem_pagamento'`, `'obrigatorio'`, `'opcional'` são aceitos
- ✅ Valor padrão: `'sem_pagamento'`

### 2. Hook useSettings
- ✅ Função `updatePaymentPolicy()` com validação
- ✅ Inclusão de `payment_policy` na função `getSafeSettings()`
- ✅ Validação de valores aceitos com mensagens de erro claras

### 3. API de Agendamento Online
- ✅ `checkOnlineBookingStatus()` retorna `payment_policy`
- ✅ `getAdminDataForBooking()` inclui `payment_policy` nas configurações
- ✅ Interface `OnlineBookingStatus` atualizada

### 4. Utilitários
- ✅ Arquivo `src/utils/paymentPolicy.ts` com funções de validação e helpers
- ✅ Constantes para valores, labels e descrições
- ✅ Funções para verificar tipo de política

### 5. Componentes Frontend
- ✅ `PaymentPolicySettings.tsx` - Componente para configurar política no painel admin
- ✅ `PaymentPolicyDisplay.tsx` - Componente para exibir política no agendamento online

## Como Usar

### 1. No Painel Administrativo

```tsx
import PaymentPolicySettings from '@/components/booking-settings/PaymentPolicySettings';

// Na página de configurações
<PaymentPolicySettings />
```

### 2. No Agendamento Online

```tsx
import PaymentPolicyDisplay from '@/components/booking/PaymentPolicyDisplay';

// No resumo da reserva
<PaymentPolicyDisplay 
  paymentPolicy={adminData.settings.payment_policy}
  valor={modalidade.valor}
  onPaymentClick={() => handlePayment()}
  showPaymentButton={true}
/>
```

### 3. Programaticamente

```tsx
import { useSettings } from '@/hooks/useSettings';
import { validatePaymentPolicy } from '@/utils/paymentPolicy';

const { settings, updatePaymentPolicy } = useSettings();

// Atualizar política
await updatePaymentPolicy('obrigatorio');

// Validar política
const validPolicy = validatePaymentPolicy('opcional'); // retorna 'opcional' ou valor padrão
```

## Valores Aceitos

| Valor | Label | Descrição |
|-------|-------|-----------|
| `sem_pagamento` | Sem Pagamento | Clientes não precisam pagar |
| `opcional` | Pagamento Opcional | Clientes podem escolher pagar ou não |
| `obrigatorio` | Pagamento Obrigatório | Pagamento é necessário para confirmar |

## Integração com Frontend de Agendamento

O frontend de agendamento online pode agora:

1. **Consultar a política** através da API `getAdminDataForBooking()`
2. **Decidir o fluxo** baseado na política:
   - `sem_pagamento`: Pular etapa de pagamento
   - `opcional`: Mostrar opção de pagamento
   - `obrigatorio`: Exigir pagamento para continuar

## Exemplo de Uso no Agendamento Online

```tsx
// No componente de agendamento online
const { data: adminData } = useAdminByUsername(username);
const paymentPolicy = adminData?.settings?.payment_policy || 'sem_pagamento';

// Decidir fluxo baseado na política
if (paymentPolicy === 'sem_pagamento') {
  // Pular etapa de pagamento
  setStep(5); // Ir direto para confirmação
} else if (paymentPolicy === 'obrigatorio') {
  // Exigir pagamento
  setStep(4); // Ir para etapa de pagamento
} else {
  // Pagamento opcional
  setStep(4); // Mostrar opção de pagamento
}
```

## Validações Implementadas

- ✅ Validação no banco de dados (CHECK constraint)
- ✅ Validação no hook useSettings
- ✅ Validação nos utilitários
- ✅ Validação na API de agendamento online
- ✅ Mensagens de erro claras e informativas

## Próximos Passos

Para completar a integração, o frontend de agendamento online deve:

1. Usar `PaymentPolicyDisplay` no resumo da reserva
2. Implementar lógica de pagamento baseada na política
3. Integrar com gateway de pagamento quando necessário
4. Adicionar `PaymentPolicySettings` na página de configurações do admin

## Arquivos Modificados/Criados

### Modificados:
- `src/hooks/useSettings.ts` - Adicionado suporte a payment_policy
- `src/api/check-online-booking.ts` - Incluído payment_policy nas APIs
- `src/types/settings.ts` - Já tinha payment_policy definido

### Criados:
- `src/utils/paymentPolicy.ts` - Utilitários para política de pagamento
- `src/components/booking-settings/PaymentPolicySettings.tsx` - Componente de configuração
- `src/components/booking/PaymentPolicyDisplay.tsx` - Componente de exibição

## Testes Recomendados

1. ✅ Testar atualização de política no painel admin
2. ✅ Testar consulta de política na API de agendamento
3. ✅ Testar validação de valores inválidos
4. ✅ Testar comportamento com diferentes políticas no agendamento online

