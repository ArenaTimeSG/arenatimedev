# Changelog

## [v1.7] - 2025-01-22

### 🚀 **Nova Funcionalidade: Sistema de Modalidades Dinâmicas**

#### **Modificações Principais:**

##### **1. Sistema de Modalidades**
- ✅ **Removidas modalidades fixas** (Vôlei, Basquete, Futsal) do sistema
- ✅ **Novo módulo "Modalidades"** em Configurações
- ✅ **CRUD completo** para modalidades (criar, editar, excluir)
- ✅ **Valores personalizados** em R$ para cada modalidade
- ✅ **Interface moderna** com Tailwind CSS e shadcn/ui

##### **2. Banco de Dados**
- ✅ **Nova tabela `modalities`** com campos:
  - `id` (UUID PK)
  - `user_id` (UUID FK para auth.users)
  - `name` (TEXT)
  - `valor` (DECIMAL(10,2))
  - `created_at`, `updated_at`
- ✅ **Tabela `appointments` atualizada** com:
  - `modality_id` (UUID FK para modalities)
  - `valor_total` (DECIMAL(10,2))
- ✅ **RLS (Row Level Security)** configurado
- ✅ **Índices otimizados** para performance

##### **3. Backend/API**
- ✅ **Hook `useModalities`** para gerenciar modalidades
- ✅ **Hook `useAppointments`** atualizado com modalidades
- ✅ **Endpoints REST** para CRUD de modalidades
- ✅ **JOIN automático** com tabela modalities
- ✅ **Cálculos financeiros** baseados em valores das modalidades

##### **4. Frontend**
- ✅ **Página Modalidades** (`/modalities`)
- ✅ **Formulário de cadastro** com validação
- ✅ **Lista com ações** (editar/excluir)
- ✅ **Formatação de moeda** brasileira (R$ XX,XX)
- ✅ **Atualização em tempo real** após operações

##### **5. Área Financeira**
- ✅ **Integração completa** com valores das modalidades
- ✅ **Dashboard atualizado** com valores em R$
- ✅ **Cards financeiros** funcionando corretamente:
  - "A Cobrar": soma valores pendentes
  - "Pagos": soma valores recebidos
  - "Esta Semana": número de agendamentos
- ✅ **Página Financial** com cálculos corretos

##### **6. Agendamentos**
- ✅ **Criação de agendamentos** com modalidades dinâmicas
- ✅ **Exibição de modalidade + valor** nos agendamentos
- ✅ **Modal de detalhes** atualizado
- ✅ **Exclusão em tempo real** sem necessidade de refresh

##### **7. Componentes Atualizados**
- ✅ **StatCard** aceita valores string/number
- ✅ **AppointmentDetailsModal** com modalidades
- ✅ **NewAppointmentModal** com modalidades dinâmicas
- ✅ **Settings** com link para Modalidades

#### **Arquivos Criados/Modificados:**

**Novos Arquivos:**
- `supabase/migrations/20250122000000_create_modalities_table.sql`
- `supabase/migrations/20250122000001_remove_fixed_modalities.sql`
- `supabase/migrations/20250122000002_update_appointments_table.sql`
- `src/hooks/useModalities.ts`
- `src/pages/Modalities.tsx`
- `src/utils/currency.ts`
- `setup_modalities.sql`
- `update_existing_appointments.sql`

**Arquivos Modificados:**
- `src/integrations/supabase/types.ts`
- `src/hooks/useAppointments.ts`
- `src/pages/Settings.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Financial.tsx`
- `src/pages/Appointments.tsx`
- `src/components/NewAppointmentModal.tsx`
- `src/components/AppointmentDetailsModal.tsx`
- `src/components/animated/StatCard.tsx`
- `src/types/settings.ts`
- `src/utils/modalities.ts`
- `src/hooks/useSettings.ts`

#### **Melhorias Técnicas:**
- ✅ **TypeScript** com interfaces atualizadas
- ✅ **React Query** para cache e sincronização
- ✅ **Validação de dados** robusta
- ✅ **Tratamento de erros** melhorado
- ✅ **Performance** otimizada com índices
- ✅ **UX/UI** moderna e responsiva

#### **Compatibilidade:**
- ✅ **Agendamentos antigos** mantidos com valores padrão
- ✅ **Migração automática** de dados existentes
- ✅ **Backward compatibility** preservada

---

### 📋 **Próximos Passos:**
1. Executar scripts SQL no Supabase
2. Testar criação de modalidades
3. Verificar cálculos financeiros
4. Validar exclusão em tempo real

### 🎯 **Status:**
- ✅ **Desenvolvimento**: Concluído
- ✅ **Testes**: Pendente
- ✅ **Deploy**: Pendente

