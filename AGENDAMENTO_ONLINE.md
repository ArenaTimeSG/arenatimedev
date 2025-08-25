# 🏀 Sistema de Agendamento Online - ArenaTime

## 📋 Visão Geral

O sistema de agendamento online permite que clientes reservem horários para práticas esportivas de forma rápida e intuitiva, sem necessidade de login ou cadastro prévio.

## 🚀 Como Acessar

Acesse a página de agendamento online através da URL:
```
http://localhost:3000/booking
```

## 🔄 Fluxo de Agendamento

### 1️⃣ Seleção da Modalidade
- **Cards interativos** para cada modalidade disponível
- **Informações exibidas**: Nome, duração, valor e descrição
- **Cores diferenciadas** para cada modalidade
- **Animações suaves** com hover effects

### 2️⃣ Calendário Interativo
- **Navegação por meses** com botões anterior/próximo
- **Datas passadas desabilitadas** automaticamente
- **Indicador visual** para data atual
- **Seleção intuitiva** com feedback visual

### 3️⃣ Horários Disponíveis
- **Agrupamento por período**: Manhã, Tarde, Noite
- **Horários ocupados** marcados em vermelho
- **Horários disponíveis** em verde
- **Seleção clara** com ícone de check

### 4️⃣ Dados do Cliente
- **Formulário responsivo** com validação
- **Campos obrigatórios**: Nome, E-mail, Telefone
- **Máscara automática** para telefone
- **Validação de e-mail** em tempo real

### 5️⃣ Confirmação Final
- **Resumo completo** da reserva
- **Dados do cliente** para revisão
- **Informações importantes** destacadas
- **Botão de confirmação** com feedback

## 🎨 Características do Design

### Responsividade
- ✅ **Mobile-first** design
- ✅ **Grid adaptativo** para diferentes telas
- ✅ **Touch-friendly** botões grandes
- ✅ **Navegação otimizada** para mobile

### Animações
- ✅ **Framer Motion** para transições suaves
- ✅ **Hover effects** interativos
- ✅ **Loading states** com feedback visual
- ✅ **Micro-interações** para melhor UX

### Acessibilidade
- ✅ **Contraste adequado** para leitura
- ✅ **Labels semânticos** nos formulários
- ✅ **Navegação por teclado** suportada
- ✅ **Screen readers** compatíveis

## 🛠️ Componentes Criados

### `OnlineBooking.tsx`
- **Página principal** com fluxo completo
- **Gerenciamento de estado** da reserva
- **Navegação entre steps** com progress indicator
- **Tela de sucesso** após confirmação

### `CardModalidade.tsx`
- **Cards clicáveis** para seleção de modalidade
- **Design colorido** com cores específicas
- **Informações completas** da modalidade
- **Animações de hover** e click

### `Calendario.tsx`
- **Calendário customizado** com date-fns
- **Navegação por meses** intuitiva
- **Validação de datas** (passadas desabilitadas)
- **Indicadores visuais** para seleção

### `ListaHorarios.tsx`
- **Grid de horários** organizados por período
- **Estados visuais** (disponível/ocupado/selecionado)
- **Botões grandes** para fácil seleção
- **Legenda explicativa** dos estados

### `FormCliente.tsx`
- **Formulário validado** com feedback
- **Máscara de telefone** automática
- **Validação de e-mail** em tempo real
- **Resumo da reserva** durante preenchimento

### `ResumoReserva.tsx`
- **Resumo completo** da reserva
- **Dados do cliente** organizados
- **Informações importantes** destacadas
- **Botão de confirmação** final

## 📱 Modalidades Disponíveis

| Modalidade | Duração | Valor | Cor | Descrição |
|------------|---------|-------|-----|-----------|
| Futsal | 60 min | R$ 80 | Azul | Quadra de futsal profissional |
| Vôlei | 90 min | R$ 100 | Verde | Quadra de vôlei oficial |
| Basquete | 60 min | R$ 90 | Laranja | Quadra de basquete regulamentar |
| Tênis | 60 min | R$ 120 | Roxo | Quadra de tênis profissional |

## 🕐 Horários Disponíveis

### Manhã
- 08:00, 09:00, 10:00, 11:00

### Tarde
- 14:00, 15:00, 16:00, 17:00

### Noite
- 18:00, 19:00, 20:00

## 🔧 Tecnologias Utilizadas

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones
- **React Router** - Navegação

## 🎯 Funcionalidades Implementadas

### ✅ Completas
- [x] Seleção de modalidade com cards interativos
- [x] Calendário customizado com validação
- [x] Lista de horários com estados visuais
- [x] Formulário de cliente com validação
- [x] Resumo final com confirmação
- [x] Tela de sucesso após confirmação
- [x] Design responsivo e acessível
- [x] Animações suaves e feedback visual
- [x] Validação de formulários
- [x] Máscara de telefone automática

### 🔄 Próximas Melhorias
- [ ] Integração com backend real
- [ ] Sistema de pagamento online
- [ ] E-mail de confirmação automático
- [ ] Sistema de cancelamento
- [ ] Histórico de reservas
- [ ] Notificações push
- [ ] Integração com WhatsApp

## 🚀 Como Testar

1. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Acesse a página de agendamento**:
   ```
   http://localhost:3000/booking
   ```

3. **Teste o fluxo completo**:
   - Selecione uma modalidade
   - Escolha uma data futura
   - Selecione um horário disponível
   - Preencha os dados do cliente
   - Confirme a reserva

4. **Verifique a responsividade**:
   - Teste em diferentes tamanhos de tela
   - Verifique a navegação mobile
   - Teste os touch interactions

## 📝 Notas de Implementação

- **Estado simulado**: Os dados são mantidos apenas no estado local
- **Horários ocupados**: Simulados com array fixo (10:00, 15:00, 19:00)
- **Validação**: Implementada no frontend com feedback visual
- **Responsividade**: Testada em breakpoints mobile, tablet e desktop
- **Performance**: Otimizada com lazy loading e memoização

## 🎨 Personalização

### Cores das Modalidades
Edite o array `modalidades` em `OnlineBooking.tsx`:
```typescript
const modalidades: Modalidade[] = [
  {
    id: '1',
    name: 'Futsal',
    duracao: 60,
    valor: 80,
    descricao: 'Quadra de futsal profissional',
    cor: 'bg-blue-500' // Personalize a cor aqui
  },
  // ... outras modalidades
];
```

### Horários Disponíveis
Edite o array `horariosDisponiveis` em `OnlineBooking.tsx`:
```typescript
const horariosDisponiveis = [
  '08:00', '09:00', '10:00', '11:00', 
  '14:00', '15:00', '16:00', '17:00', 
  '18:00', '19:00', '20:00'
];
```

### Horários Ocupados
Edite o array `horariosOcupados` em `ListaHorarios.tsx`:
```typescript
const horariosOcupados = ['10:00', '15:00', '19:00'];
```

---

**Desenvolvido com ❤️ para ArenaTime**
