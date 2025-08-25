# 🏀 Sistema de Agendamento Online com Username Único

## 📋 Visão Geral

O sistema de agendamento online foi implementado com suporte a **usernames únicos** para cada usuário da plataforma, permitindo que cada dono de agenda tenha seu próprio link público para agendamentos.

## 🚀 Funcionalidades Implementadas

### ✅ **1. Campo Username Obrigatório**
- **Campo único** na tabela `user_profiles`
- **Validação rigorosa**: apenas letras, números e hífens
- **Geração automática** baseada no nome do usuário
- **Verificação de disponibilidade** em tempo real

### ✅ **2. URLs Únicas de Agendamento**
- **Formato**: `/booking/{username}`
- **Exemplo**: `/booking/joao-silva`
- **Acesso público** sem necessidade de login
- **Validação de existência** do username

### ✅ **3. Sistema de Configurações**
- **Ativar/desativar** agendamento online
- **Confirmação automática** ou manual
- **Tempo mínimo** de antecedência
- **Horários de funcionamento** personalizados

### ✅ **4. Integração Completa**
- **Modalidades dinâmicas** do usuário
- **Horários disponíveis** baseados nas configurações
- **Salvamento correto** vinculado ao dono da agenda
- **Status de agendamento** (confirmado/pendente)

## 🔧 Implementação Técnica

### **Banco de Dados**

#### **1. Migração de Username**
```sql
-- Arquivo: supabase/migrations/20250123000000_add_username_to_user_profiles.sql
ALTER TABLE public.user_profiles 
ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL;

-- Constraints de validação
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_username_format 
CHECK (username ~ '^[a-zA-Z0-9-]+$');

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_username_length 
CHECK (length(username) >= 3 AND length(username) <= 50);
```

#### **2. Atualização de Usuários Existentes**
```sql
-- Arquivo: update_existing_users_with_username.sql
-- Gera username baseado no nome do usuário
UPDATE public.user_profiles 
SET username = generate_username_from_name(name)
WHERE username IS NULL OR username = '';
```

### **Frontend**

#### **1. Formulário de Cadastro Atualizado**
- **Campo username** obrigatório
- **Geração automática** baseada no nome
- **Validação em tempo real**
- **Verificação de disponibilidade**

#### **2. Página de Agendamento Online**
- **Rota dinâmica**: `/booking/{username}`
- **Busca por username** em vez de nome
- **Verificação de existência** do usuário
- **Configurações específicas** do dono da agenda

#### **3. Componente de Link de Compartilhamento**
- **Geração automática** da URL
- **Botão de cópia** para área de transferência
- **Abertura em nova aba**
- **Status visual** (ativo/inativo)

### **Backend**

#### **1. Hook useAdminByUsername**
```typescript
// Busca usuário por username em vez de nome
const { data: user, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('username', username)
  .eq('is_active', true)
  .single();
```

#### **2. Hook useOnlineBooking**
```typescript
// Determina status baseado na configuração
const appointmentStatus = data.auto_confirmada ? 'agendado' : 'a_cobrar';

// Salva agendamento vinculado ao admin
const { data: appointment } = await supabase
  .from('appointments')
  .insert({
    client_id: clientId,
    date: appointmentDate.toISOString(),
    status: appointmentStatus,
    user_id: data.admin_user_id, // Vinculado ao dono da agenda
    valor_total: data.valor,
  });
```

## 📱 Como Usar

### **Para Usuários (Donos de Agenda)**

#### **1. Configurar Username**
1. Acesse **Configurações** → **Perfil**
2. Configure seu **username único**
3. Salve as alterações

#### **2. Ativar Agendamento Online**
1. Acesse **Configurações** → **Agendamento Online**
2. Ative o **Toggle de Agendamento Online**
3. Configure as **regras de agendamento**
4. Copie o **link de compartilhamento**

#### **3. Compartilhar Link**
- **Copie o link** gerado automaticamente
- **Compartilhe** com seus clientes
- **Cole em** redes sociais, WhatsApp, etc.

### **Para Clientes**

#### **1. Acessar Agendamento**
- **Clique no link** compartilhado
- **Exemplo**: `https://arenatime.com/booking/joao-silva`

#### **2. Fazer Reserva**
1. **Escolha a modalidade** desejada
2. **Selecione a data** no calendário
3. **Escolha o horário** disponível
4. **Preencha seus dados** (nome, email, telefone)
5. **Confirme a reserva**

#### **3. Status da Reserva**
- **Confirmação automática**: reserva confirmada imediatamente
- **Confirmação manual**: aguarda aprovação do dono da agenda

## 🔒 Segurança e Validações

### **Validações de Username**
- ✅ **Formato**: apenas letras, números e hífens
- ✅ **Tamanho**: mínimo 3, máximo 50 caracteres
- ✅ **Unicidade**: username único no sistema
- ✅ **Não pode começar/terminar** com hífen
- ✅ **Não pode ter hífens consecutivos**

### **Validações de Acesso**
- ✅ **Username deve existir** na base de dados
- ✅ **Usuário deve estar ativo**
- ✅ **Agendamento online deve estar ativo**
- ✅ **Modalidades devem estar cadastradas**

### **Validações de Agendamento**
- ✅ **Respeita horários** de funcionamento
- ✅ **Respeita tempo mínimo** de antecedência
- ✅ **Verifica disponibilidade** do horário
- ✅ **Vincula corretamente** ao dono da agenda

## 🧪 Testes

### **Scripts de Teste Disponíveis**

#### **1. Teste de Integração Completa**
```sql
-- Arquivo: test_username_booking_integration.sql
-- Testa toda a funcionalidade de username e agendamento
```

#### **2. Teste de Agendamento Online**
```sql
-- Arquivo: test_online_booking_integration.sql
-- Testa especificamente o agendamento online
```

### **Como Executar os Testes**

1. **Execute a migração**:
   ```bash
   supabase db push
   ```

2. **Atualize usuários existentes**:
   ```sql
   \i update_existing_users_with_username.sql
   ```

3. **Execute os testes**:
   ```sql
   \i test_username_booking_integration.sql
   ```

## 🐛 Solução de Problemas

### **Problema: Username não encontrado**
**Solução**: Verifique se o username existe na tabela `user_profiles`

### **Problema: Link não funciona**
**Solução**: Verifique se o agendamento online está ativo nas configurações

### **Problema: Horários não aparecem**
**Solução**: Verifique se há modalidades cadastradas e horários configurados

### **Problema: Agendamento não salva**
**Solução**: Verifique se o usuário tem permissões e se as configurações estão corretas

## 📈 Próximas Melhorias

### **Funcionalidades Planejadas**
- [ ] **Notificações automáticas** para novos agendamentos
- [ ] **Integração com WhatsApp** para confirmações
- [ ] **Relatórios de agendamentos** online
- [ ] **Personalização visual** do link de agendamento
- [ ] **Sistema de avaliações** dos clientes

### **Melhorias Técnicas**
- [ ] **Cache otimizado** para melhor performance
- [ ] **Rate limiting** para evitar spam
- [ ] **Logs detalhados** para auditoria
- [ ] **Backup automático** das reservas

## 📞 Suporte

Para dúvidas ou problemas com a implementação:

1. **Verifique os logs** do console do navegador
2. **Execute os scripts de teste** para diagnosticar
3. **Consulte a documentação** do Supabase
4. **Entre em contato** com a equipe de desenvolvimento

---

**ArenaTime** - Sistema de Agendamento Online com Username Único ✅
