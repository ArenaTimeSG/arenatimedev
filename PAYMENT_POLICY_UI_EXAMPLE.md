# Exemplo da Interface - Política de Pagamento

## Localização na Interface

O componente de **Política de Pagamento** foi adicionado na página de **Configurações** → **Agendamento Online**.

### Caminho de Navegação:
```
Configurações → Aba "Agendamento Online" → Seção "Política de Pagamento"
```

## Como Aparece na Interface

### 1. Cabeçalho da Seção
```
┌─────────────────────────────────────────────────────────────┐
│  💳  Política de Pagamento                                 │
│     Configure como os clientes devem pagar pelos           │
│     agendamentos online                                    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Campo de Seleção
```
┌─────────────────────────────────────────────────────────────┐
│ Política de Pagamento                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 Sem Pagamento ▼                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3. Descrição da Política Selecionada
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 Sem Pagamento                    [sem_pagamento]        │
│    Os clientes não precisam pagar para fazer agendamentos  │
│    💰 R$ 0,00                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Botão de Salvar
```
┌─────────────────────────────────────────────────────────────┐
│                                    [💾 Salvar]             │
└─────────────────────────────────────────────────────────────┘
```

### 5. Informações Adicionais
```
┌─────────────────────────────────────────────────────────────┐
│ • Sem Pagamento: Clientes podem agendar sem pagar          │
│ • Opcional: Clientes escolhem se querem pagar              │
│ • Obrigatório: Pagamento é necessário para confirmar       │
└─────────────────────────────────────────────────────────────┘
```

## Opções Disponíveis

### 1. Sem Pagamento (sem_pagamento)
- **Ícone**: 🟢 CheckCircle (verde)
- **Badge**: Verde
- **Descrição**: "Os clientes não precisam pagar para fazer agendamentos"
- **Comportamento**: Clientes podem agendar sem pagar

### 2. Pagamento Opcional (opcional)
- **Ícone**: 🟡 CreditCard (amarelo)
- **Badge**: Cinza
- **Descrição**: "Os clientes podem escolher se querem pagar ou não"
- **Comportamento**: Clientes escolhem pagar agora ou no local

### 3. Pagamento Obrigatório (obrigatorio)
- **Ícone**: 🔴 AlertCircle (vermelho)
- **Badge**: Vermelho
- **Descrição**: "Os clientes devem pagar para confirmar o agendamento"
- **Comportamento**: Pagamento é necessário para confirmar

## Estados do Componente

### Estado Normal
- Campo de seleção ativo
- Botão "Salvar" habilitado quando há mudanças
- Descrição da política atual visível

### Estado Salvando
- Botão mostra "Salvando..." com spinner
- Campo de seleção desabilitado
- Feedback visual de carregamento

### Estado Salvo
- Botão mostra "Salvo!" com ícone de check
- Feedback temporário de sucesso
- Retorna ao estado normal após 3 segundos

## Integração com o Sistema

### 1. Persistência
- Valor salvo na tabela `settings` na coluna `payment_policy`
- Sincronização automática com o cache do React Query
- Validação no backend e frontend

### 2. Uso no Agendamento Online
- API `getAdminDataForBooking()` retorna a política
- Frontend de agendamento pode consultar e decidir o fluxo
- Componente `PaymentPolicyDisplay` pode ser usado para exibir

### 3. Validação
- Apenas valores válidos são aceitos
- Mensagens de erro claras para valores inválidos
- Validação tanto no frontend quanto no backend

## Exemplo de Uso no Código

```tsx
// Na página de configurações
import PaymentPolicySettings from '@/components/booking-settings/PaymentPolicySettings';

<TabsContent value="online-booking" className="space-y-6">
  <div className="grid gap-6">
    <ToggleAgendamento />
    <LinkCompartilhamento />
    <ConfiguracoesRegras />
    <PaymentPolicySettings /> {/* ← Novo componente */}
  </div>
</TabsContent>
```

## Responsividade

- **Desktop**: Layout em grid com espaçamento adequado
- **Mobile**: Componente se adapta ao tamanho da tela
- **Tablet**: Layout responsivo mantém usabilidade

## Acessibilidade

- Labels associados aos campos
- Ícones com significado semântico
- Cores com contraste adequado
- Navegação por teclado suportada
- Screen readers compatíveis

