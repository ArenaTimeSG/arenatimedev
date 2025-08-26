# 🔧 Migração do Sistema de Agendamento Online

## 📋 Resumo das Correções

Este documento descreve as correções implementadas para o módulo de agendamento online:

### ✅ **Problemas Corrigidos**

1. **Campo `online_enabled` ausente**: Adicionado campo boolean na tabela `settings`
2. **Configurações não salvas**: Corrigido o salvamento das configurações no banco
3. **Verificação de status**: Implementada verificação adequada do status do agendamento online
4. **Interface de usuário**: Corrigida a interface para refletir o status real

### 🗄️ **Estrutura do Banco de Dados**

#### **Novos Campos na Tabela `settings`:**

```sql
-- Campo para controlar se o agendamento online está ativo
online_enabled BOOLEAN DEFAULT false

-- Configurações específicas do agendamento online
online_booking JSONB DEFAULT jsonb_build_object(
    'auto_agendar', false,
    'tempo_minimo_antecedencia', 24,
    'duracao_padrao', 60
)

-- Horários de funcionamento (se não existir)
working_hours JSONB DEFAULT jsonb_build_object(
    'monday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'tuesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'wednesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'thursday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'friday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'saturday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
    'sunday', jsonb_build_object('enabled', false, 'start', '08:00', 'end', '18:00')
)
```

## 🚀 **Como Executar a Migração**

### **Opção 1: Usando o Script Node.js**

1. **Instalar dependências** (se necessário):
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. **Configurar variáveis de ambiente**:
   Certifique-se de que o arquivo `.env` contém:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

3. **Executar a migração**:
   ```bash
   node run_migration.js
   ```

### **Opção 2: Executando SQL Diretamente**

Execute o arquivo `supabase/migrations/20250122000000_add_online_enabled_field.sql` no seu banco de dados Supabase.

### **Opção 3: Via Supabase Dashboard**

1. Acesse o Supabase Dashboard
2. Vá para a seção "SQL Editor"
3. Execute o conteúdo do arquivo `supabase/migrations/20250122000000_add_online_enabled_field.sql`

## 🔍 **Verificação da Migração**

Após executar a migração, você pode verificar se tudo foi aplicado corretamente:

### **1. Verificar Campos na Tabela Settings**

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'settings'
AND column_name IN ('online_enabled', 'online_booking', 'working_hours');
```

### **2. Verificar Configurações Existentes**

```sql
SELECT user_id, online_enabled, online_booking, working_hours
FROM public.settings
LIMIT 5;
```

## 🎯 **Funcionalidades Implementadas**

### **1. Toggle de Agendamento Online**
- ✅ Campo `online_enabled` na tabela `settings`
- ✅ Interface para ativar/desativar no painel do administrador
- ✅ Salvamento automático no banco de dados
- ✅ Feedback visual do status atual

### **2. Verificação de Status**
- ✅ API para verificar se o agendamento online está ativo
- ✅ Bloqueio automático se desativado
- ✅ Mensagem clara para o usuário

### **3. Configurações Avançadas**
- ✅ Auto-confirmação de reservas
- ✅ Tempo mínimo de antecedência
- ✅ Duração padrão dos agendamentos
- ✅ Salvamento automático das configurações

### **4. Segurança**
- ✅ Verificação no frontend e backend
- ✅ Bloqueio mesmo com acesso direto ao link
- ✅ Validação de dados

## 🧪 **Testando as Correções**

### **1. Teste do Administrador**

1. Acesse as configurações do administrador
2. Vá para a aba "Agendamento Online"
3. Ative/desative o toggle
4. Verifique se a mudança é salva
5. Recarregue a página e confirme que o status persiste

### **2. Teste do Cliente**

1. Com o agendamento **ativado**:
   - Acesse o link de agendamento
   - Deve carregar normalmente a tela de agendamento

2. Com o agendamento **desativado**:
   - Acesse o link de agendamento
   - Deve exibir: "Agendamento online desativado pelo administrador"

### **3. Teste de Segurança**

1. Ative o agendamento online
2. Copie o link de agendamento
3. Desative o agendamento online
4. Tente acessar o link copiado
5. Deve ser bloqueado mesmo com o link direto

## 📝 **Arquivos Modificados**

### **Novos Arquivos:**
- `src/api/check-online-booking.ts` - API para verificar status
- `supabase/migrations/20250122000000_add_online_enabled_field.sql` - Migração do banco
- `run_migration.js` - Script para executar migração
- `MIGRATION_README.md` - Este arquivo

### **Arquivos Modificados:**
- `src/types/settings.ts` - Adicionados tipos para agendamento online
- `src/hooks/useSettings.ts` - Suporte aos novos campos
- `src/pages/Settings.tsx` - Interface corrigida
- `src/hooks/useAdminByUsername.ts` - Usa nova API
- `src/pages/OnlineBooking.tsx` - Verificação de status

## 🚨 **Troubleshooting**

### **Problema: Campos não aparecem após migração**
**Solução:** Verifique se a migração foi executada corretamente e se não houve erros.

### **Problema: Configurações não são salvas**
**Solução:** Verifique se o hook `useSettings` está funcionando e se as permissões RLS estão corretas.

### **Problema: Erro ao acessar agendamento online**
**Solução:** Verifique se o campo `online_enabled` existe e se está sendo lido corretamente.

## 📞 **Suporte**

Se encontrar problemas durante a migração ou implementação, verifique:

1. Logs do console do navegador
2. Logs do Supabase
3. Estrutura da tabela `settings`
4. Permissões RLS

---

**✅ Migração concluída com sucesso!**
