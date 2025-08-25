# ⚙️ Módulo de Configurações do Agendamento Online - ArenaTime

## 📋 Visão Geral

O módulo de configurações do agendamento online permite que administradores gerenciem todas as opções do sistema de agendamento online, controlando desde o status geral até regras específicas e modalidades disponíveis.

## 🚀 Como Acessar

Acesse o módulo de configurações através da URL:
```
http://localhost:3000/booking-settings
```

## 🔧 Funcionalidades Implementadas

### 1️⃣ Toggle de Ativação/Desativação
- **Switch interativo** para ativar/desativar o agendamento online
- **Feedback visual** com cores e ícones
- **Status em tempo real** do sistema
- **Botões de ação rápida** para ativar/desativar

### 2️⃣ Gerenciamento do Link Público
- **Exibição do link** de agendamento público
- **Botão de cópia** para área de transferência
- **Botão de visualização** para abrir o link
- **Ocultação do link** com toggle de visibilidade
- **Estatísticas** de visualizações e reservas
- **Dicas de compartilhamento**

### 3️⃣ Configurações de Regras
- **Tempo mínimo de antecedência** (em horas)
- **Duração padrão** das reservas (em minutos)
- **Validação de campos** com limites
- **Exemplos dinâmicos** de horários
- **Salvamento com feedback** visual
- **Detecção de alterações** não salvas

### 4️⃣ Gerenciamento de Modalidades
- **Lista completa** de modalidades cadastradas
- **Toggle individual** para cada modalidade
- **Estatísticas** de modalidades ativas/inativas
- **Informações detalhadas** (duração, valor, descrição)
- **Feedback visual** para modalidades inativas
- **Percentual de disponibilidade**

### 5️⃣ Visualização de Reservas
- **Lista de reservas futuras** com scroll
- **Filtros por status** (pendente, confirmada, realizada, cancelada)
- **Ações rápidas** para cada reserva:
  - Confirmar reserva pendente
  - Cancelar reserva
  - Marcar como realizada
- **Informações completas** do cliente
- **Status visual** com cores e ícones

## 🎨 Características do Design

### Layout Responsivo
- ✅ **Grid adaptativo** para diferentes telas
- ✅ **Coluna lateral** para reservas em telas grandes
- ✅ **Layout empilhado** em dispositivos móveis
- ✅ **Scroll otimizado** para listas longas

### Animações e Interações
- ✅ **Framer Motion** para transições suaves
- ✅ **Toggle switches** animados
- ✅ **Feedback visual** para ações
- ✅ **Loading states** durante operações
- ✅ **Hover effects** e micro-interações

### Acessibilidade
- ✅ **Contraste adequado** para leitura
- ✅ **Labels semânticos** nos formulários
- ✅ **Navegação por teclado** suportada
- ✅ **Estados visuais** claros
- ✅ **Feedback auditivo** (opcional)

## 🛠️ Componentes Criados

### `OnlineBookingSettings.tsx`
- **Página principal** com layout responsivo
- **Gerenciamento de estado** global
- **Integração** de todos os componentes
- **Estatísticas rápidas** no rodapé

### `ToggleAgendamento.tsx`
- **Switch animado** para ativação/desativação
- **Status visual** com cores e ícones
- **Informações contextuais** sobre o estado
- **Botões de ação rápida**

### `LinkCompartilhamento.tsx`
- **Campo de link** com opções de cópia
- **Toggle de visibilidade** do link
- **Estatísticas** de uso
- **Dicas de compartilhamento**

### `ConfiguracoesRegras.tsx`
- **Formulário de configurações** com validação
- **Exemplos dinâmicos** de horários
- **Detecção de alterações** não salvas
- **Feedback de salvamento**

### `ListaModalidades.tsx`
- **Lista interativa** de modalidades
- **Toggle switches** individuais
- **Estatísticas** de disponibilidade
- **Informações detalhadas** de cada modalidade

### `ListaReservas.tsx`
- **Lista scrollável** de reservas futuras
- **Ações contextuais** por status
- **Informações completas** do cliente
- **Status visual** com cores e ícones

## 📊 Dados Simulados

### Configurações Padrão
```typescript
{
  ativo: true,
  tempoMinimoAntecedencia: 24, // horas
  duracaoPadrao: 60, // minutos
  linkPublico: 'https://arenatime.com/booking'
}
```

### Modalidades de Exemplo
- **Futsal** (60min - R$ 80) - Ativa
- **Vôlei** (90min - R$ 100) - Ativa
- **Basquete** (60min - R$ 90) - Inativa
- **Tênis** (60min - R$ 120) - Ativa

### Reservas de Exemplo
- **João Silva** - Futsal - Amanhã 14:00 - Pendente
- **Maria Santos** - Vôlei - Depois de amanhã 16:00 - Confirmada
- **Pedro Costa** - Tênis - 3 dias - Realizada

## 🎯 Funcionalidades Avançadas

### Validação de Formulários
- **Limites mínimos e máximos** para campos numéricos
- **Validação em tempo real** com feedback
- **Prevenção de valores inválidos**

### Estados de Loading
- **Indicadores visuais** durante operações
- **Desabilitação de botões** durante processamento
- **Feedback de sucesso** após operações

### Responsividade
- **Breakpoints otimizados** para mobile, tablet e desktop
- **Layout adaptativo** baseado no tamanho da tela
- **Touch-friendly** para dispositivos móveis

## 🔄 Fluxo de Trabalho

### 1. Configuração Inicial
1. Acesse o módulo de configurações
2. Ative o agendamento online
3. Configure as regras básicas
4. Ative as modalidades desejadas

### 2. Gerenciamento Diário
1. Visualize reservas pendentes
2. Confirme ou cancele reservas
3. Marque reservas como realizadas
4. Monitore estatísticas

### 3. Manutenção
1. Ajuste regras conforme necessário
2. Ative/desative modalidades
3. Monitore o link de compartilhamento
4. Analise estatísticas de uso

## 🚀 Como Testar

1. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Acesse o módulo de configurações**:
   ```
   http://localhost:3000/booking-settings
   ```

3. **Teste as funcionalidades**:
   - Toggle de ativação/desativação
   - Cópia do link público
   - Alteração de regras
   - Ativação/desativação de modalidades
   - Gerenciamento de reservas

4. **Verifique a responsividade**:
   - Teste em diferentes tamanhos de tela
   - Verifique a navegação mobile
   - Teste os touch interactions

## 📝 Notas de Implementação

- **Estado simulado**: Todos os dados são mantidos no estado local
- **Persistência**: Em produção, integrar com backend/banco de dados
- **Validação**: Implementada no frontend com feedback visual
- **Performance**: Otimizada com lazy loading e memoização
- **Segurança**: Em produção, adicionar autenticação e autorização

## 🔮 Próximas Melhorias

### Funcionalidades Planejadas
- [ ] Integração com backend real
- [ ] Sistema de notificações
- [ ] Relatórios detalhados
- [ ] Configurações avançadas
- [ ] Backup e restauração de configurações
- [ ] Histórico de alterações
- [ ] Múltiplos usuários administradores

### Melhorias de UX
- [ ] Drag and drop para reordenar modalidades
- [ ] Filtros avançados para reservas
- [ ] Busca e paginação
- [ ] Exportação de dados
- [ ] Temas personalizáveis
- [ ] Modo escuro

---

**Desenvolvido com ❤️ para ArenaTime**
