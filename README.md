# 🏀 ArenaTime - Sistema de Gestão de Agendamentos

Um sistema moderno e completo para gestão de agendamentos de quadras esportivas, desenvolvido com React, TypeScript e Supabase.

## ✨ Características Principais

- **Dashboard Moderno**: Interface limpa e intuitiva com visualização semanal de agendamentos
- **Gestão de Clientes**: Cadastro e gerenciamento completo de clientes
- **Agendamentos Flexíveis**: Suporte a agendamentos únicos e recorrentes
- **Controle Financeiro**: Acompanhamento de pagamentos e relatórios
- **Configurações Personalizáveis**: Horários de funcionamento e preferências
- **Design Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Autenticação Segura**: Sistema de login com Supabase Auth

## 🎨 Design System Moderno

### Paleta de Cores Atualizada
- **Primária**: Tons de azul/indigo (blue-600, indigo-600)
- **Secundária**: Tons de slate para textos e bordas
- **Acentos**: Verde para sucessos, laranja para alertas, vermelho para erros
- **Background**: Gradientes suaves de slate-50 para blue-50

### Componentes Redesenhados
- **Cards**: Bordas arredondadas (rounded-2xl), sombras suaves, fundo translúcido
- **Botões**: Hover states aprimorados, animações suaves
- **Headers**: Fundo translúcido com backdrop-blur
- **Sidebar**: Minimalista com ícones e indicadores visuais

## 🚀 Módulos Modernizados

### 📊 Dashboard
- **Sidebar Minimalista**: Ícones apenas, fundo translúcido, animações suaves
- **Header Limpo**: Gradiente sutil no título, botões modernos
- **Cards de Estatísticas**: Maiores, mais espaçosos, ícones coloridos
- **Agenda Semanal**: Layout mais limpo, células maiores, melhor contraste
- **Cards de Agendamento**: Bordas arredondadas, gradientes aprimorados

### 💰 Área Financeira
- **Header Moderno**: Design consistente com gradiente azul
- **Cards de Resumo**: Layout em grid responsivo com ícones coloridos
- **Navegação por Mês**: Interface melhorada com botões estilizados
- **Relatório PDF**: Botão destacado no header
- **Resumo por Cliente**: Cards com hover effects e animações
- **Ações Rápidas**: Botões grandes com ícones e hover states

### 📅 Agendamentos
- **Header Consistente**: Mesmo padrão visual dos outros módulos
- **Filtros Modernos**: Cards com gradiente, inputs estilizados
- **Estatísticas**: Cards coloridos com ícones e métricas
- **Lista de Agendamentos**: Cards com hover effects, badges coloridos
- **Separação Futuros/Realizados**: Visual diferenciado para cada tipo

### 👥 Clientes
- **Busca Aprimorada**: Input maior com ícone integrado
- **Estatísticas Detalhadas**: Cards para total, com email, com telefone
- **Lista de Clientes**: Cards com informações organizadas, ícones para contato
- **Estados Vazios**: Ilustrações e mensagens amigáveis

### ⚙️ Configurações
- **Tabs Modernos**: Design com gradiente, estados ativos destacados
- **Cards Organizados**: Cada seção em card separado com header estilizado
- **Formulários**: Inputs com bordas suaves, labels bem definidos
- **Switches**: Cores consistentes com o tema azul
- **Botões de Ação**: Estilo moderno com ícones e hover effects

### 🔐 Autenticação (Login/Cadastro)
- **Tela de Login Moderna**: Design split-screen com sidebar informativa
- **Sidebar Informativa**: Gradiente azul/indigo, ícones animados, informações do sistema
- **Formulários Redesenhados**: Cards com backdrop-blur, inputs estilizados
- **Tabs Interativas**: Alternância suave entre login e cadastro
- **Validação Visual**: Ícones de check/error em tempo real
- **Animações Framer Motion**: Entrada suave, hover effects, transições

### 🏠 Tela Inicial (Landing Page)
- **Hero Section**: Gradiente azul/indigo, logo animado, call-to-action destacado
- **Seção de Funcionalidades**: Cards com ícones coloridos, hover effects
- **Estatísticas**: Números animados com hover effects
- **Call-to-Action Final**: Seção destacada para conversão
- **Design Responsivo**: Adaptação perfeita para todos os dispositivos
- **Animações Scroll**: Elementos aparecem conforme o scroll

## 🎭 Animações e Interações

### Framer Motion
- **Entrada de Páginas**: Animações suaves de fade-in e slide
- **Cards**: Hover effects com scale e shadow
- **Botões**: Micro-interações de press e hover
- **Loading States**: Spinners modernos com gradiente azul

### Estados Visuais
- **Loading**: Spinner centralizado com mensagem
- **Vazio**: Ilustrações e call-to-actions claros
- **Erro**: Mensagens amigáveis com opções de retry
- **Sucesso**: Toasts com ícones e cores apropriadas

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 640px - Layout em coluna única
- **Tablet**: 640px - 1024px - Grid adaptativo
- **Desktop**: > 1024px - Layout completo com sidebar

### Componentes Adaptativos
- **Cards**: Grid responsivo (1-4 colunas)
- **Tabelas**: Scroll horizontal em telas pequenas
- **Formulários**: Layout em coluna única no mobile
- **Navegação**: Sidebar colapsável em mobile

## 🎯 Melhorias de UX/UI

### Acessibilidade
- **Contraste**: Melhor legibilidade com cores otimizadas
- **Foco**: Estados de foco visíveis em todos os elementos
- **Navegação**: Indicadores visuais claros
- **Feedback**: Confirmações visuais para todas as ações

### Performance
- **Animações Otimizadas**: Transições suaves sem impacto na performance
- **Lazy Loading**: Componentes carregados sob demanda
- **Caching**: Dados sincronizados eficientemente
- **Bundle**: Código otimizado para produção

## 🔧 Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Date Handling**: date-fns
- **PDF Generation**: jsPDF, jspdf-autotable
- **Icons**: Lucide React

## 📦 Instalação

```bash
# Clone o repositório
git clone [url-do-repositorio]

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute o projeto
npm run dev
```

## 🌟 Funcionalidades Principais

### Dashboard
- ✅ Visualização semanal de agendamentos
- ✅ Estatísticas em tempo real
- ✅ Navegação entre semanas
- ✅ Criação rápida de agendamentos
- ✅ Exportação de horários em PDF

### Agendamentos
- ✅ Listagem com filtros avançados
- ✅ Separação entre futuros e realizados
- ✅ Agendamentos únicos e recorrentes
- ✅ Edição e cancelamento
- ✅ Status de pagamento

### Clientes
- ✅ Cadastro completo de clientes
- ✅ Busca por nome, email ou telefone
- ✅ Histórico de agendamentos
- ✅ Informações de contato

### Financeiro
- ✅ Resumo mensal de receitas
- ✅ Relatórios por cliente
- ✅ Status de pagamentos
- ✅ Exportação de relatórios PDF

### Configurações
- ✅ Perfil do usuário
- ✅ Horários de funcionamento
- ✅ Configurações de agendamentos
- ✅ Preferências de notificações
- ✅ Segurança da conta

## 🎨 Design System

### Cores
```css
/* Primárias */
--blue-600: #2563eb
--indigo-600: #4f46e5

/* Neutras */
--slate-50: #f8fafc
--slate-200: #e2e8f0
--slate-600: #475569
--slate-800: #1e293b

/* Estados */
--green-600: #16a34a
--orange-600: #ea580c
--red-600: #dc2626
```

### Tipografia
- **Títulos**: font-bold, text-2xl
- **Subtítulos**: font-semibold, text-lg
- **Corpo**: font-medium, text-sm
- **Legendas**: text-xs, text-slate-500

### Espaçamentos
- **Cards**: p-6, gap-6
- **Seções**: space-y-6
- **Elementos**: gap-4, gap-3, gap-2

## 🚀 Deploy

O projeto está configurado para deploy na Vercel:

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia o [CONTRIBUTING.md](CONTRIBUTING.md) antes de submeter um pull request.

---

**ArenaTime** - Transformando a gestão de agendamentos esportivos com tecnologia moderna e design elegante! 🏀✨
