# 🚀 GUIA DE RECUPERAÇÃO DO BANCO DE DADOS - ARENA TIME

## 📋 **RESUMO DO SISTEMA**

Sua aplicação é um **sistema de agendamento de quadras/espaços** com integração ao **Mercado Pago** para pagamentos. O sistema foi completamente analisado e os scripts de recuperação foram criados.

## 🗂️ **ARQUIVOS CRIADOS**

### **Scripts de Recuperação por Etapas:**
1. `recovery_step1_basic_tables.sql` - Tabelas básicas (clients, appointments, recurrences)
2. `recovery_step2_payment_system.sql` - Sistema de pagamentos (payments, settings)
3. `recovery_step3_auxiliary_tables.sql` - Tabelas auxiliares (monthly_events, time_blockades, etc.)
4. `recovery_step4_rls_policies.sql` - Políticas RLS finais
5. `recovery_step5_verification.sql` - Verificação e teste do sistema

### **Script Consolidado:**
- `recovery_complete_database.sql` - **EXECUTE ESTE** para recuperação completa

## 🎯 **COMO EXECUTAR A RECUPERAÇÃO**

### **OPÇÃO 1: Recuperação Completa (Recomendada)**
```sql
-- Execute o arquivo recovery_complete_database.sql no SQL Editor do Supabase
-- Este script executa todas as etapas em sequência
```

### **OPÇÃO 2: Recuperação por Etapas**
```sql
-- Execute na ordem:
1. recovery_step1_basic_tables.sql
2. recovery_step2_payment_system.sql
3. recovery_step3_auxiliary_tables.sql
4. recovery_step4_rls_policies.sql
5. recovery_step5_verification.sql
```

## 📊 **ESTRUTURA DO BANCO RECUPERADO**

### **Tabelas Principais:**
- **`clients`** - Clientes do sistema
- **`appointments`** - Agendamentos principais
- **`payments`** - Pagamentos (Mercado Pago)
- **`settings`** - Configurações por usuário

### **Tabelas Auxiliares:**
- **`monthly_events`** - Eventos mensais
- **`time_blockades`** - Bloqueios de horários
- **`booking_clients`** - Clientes para reservas online
- **`online_reservations`** - Reservas online
- **`recurrences`** - Configurações de recorrência

### **Funcionalidades Incluídas:**
- ✅ **Sistema de Pagamentos** completo (Mercado Pago)
- ✅ **Políticas RLS** configuradas
- ✅ **Triggers** para updated_at
- ✅ **Índices** para performance
- ✅ **Enums** para status
- ✅ **Acesso público** para reservas online

## 🔧 **CONFIGURAÇÕES DO SISTEMA**

### **URLs do Supabase:**
- **URL:** `https://xtufbfvrgpzqbvdfmtiy.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M`

### **Webhook do Mercado Pago:**
- **URL:** `https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook`

## 📝 **INSTRUÇÕES DE EXECUÇÃO**

### **1. Acesse o Supabase Dashboard**
```
https://supabase.com/dashboard/project/xtufbfvrgpzqbvdfmtiy/sql
```

### **2. Execute o Script Principal**
```sql
-- Cole o conteúdo do arquivo recovery_complete_database.sql
-- e execute no SQL Editor
```

### **3. Verifique a Execução**
- O script mostrará mensagens de sucesso para cada etapa
- Verifique se todas as tabelas foram criadas
- Confirme se as políticas RLS estão ativas

## 🧪 **TESTE DO SISTEMA**

### **Teste Básico:**
1. **Criar um cliente:**
```sql
INSERT INTO public.clients (name, email) 
VALUES ('Cliente Teste', 'teste@email.com');
```

2. **Criar um agendamento:**
```sql
INSERT INTO public.appointments (user_id, client_id, date, modality) 
VALUES ('seu-user-id', 'client-id', NOW() + INTERVAL '1 day', 'Personal Training');
```

3. **Verificar se foi criado:**
```sql
SELECT * FROM public.appointments WHERE modality = 'Personal Training';
```

## ⚠️ **IMPORTANTE**

### **Antes de Executar:**
- ✅ Faça backup do banco atual (se houver dados importantes)
- ✅ Confirme que você tem acesso ao Supabase Dashboard
- ✅ Verifique se as credenciais estão corretas

### **Após a Execução:**
- ✅ Execute o script de verificação (`recovery_step5_verification.sql`)
- ✅ Teste a criação de dados básicos
- ✅ Verifique se o frontend consegue conectar

## 🆘 **SUPORTE**

### **Se algo der errado:**
1. **Verifique os logs** no Supabase Dashboard
2. **Execute o script de verificação** para identificar problemas
3. **Execute as etapas individualmente** se necessário

### **Logs Esperados:**
```
✅ Todas as 9 tabelas foram criadas com sucesso!
✅ Tabela clients criada
✅ Tabela appointments criada
✅ Tabela payments criada
✅ Tabela settings criada
✅ Tabela monthly_events criada
✅ Tabela time_blockades criada
✅ Tabela booking_clients criada
✅ Tabela online_reservations criada
✅ Tabela recurrences criada
🎉 RECUPERAÇÃO COMPLETA FINALIZADA! Sistema pronto para uso!
```

## 🎉 **RESULTADO FINAL**

Após a execução bem-sucedida, você terá:
- ✅ **Banco de dados completamente funcional**
- ✅ **Sistema de pagamentos integrado**
- ✅ **Políticas de segurança configuradas**
- ✅ **Estrutura pronta para o frontend**
- ✅ **Sistema de reservas online funcionando**

**🚀 Seu sistema Arena Time estará pronto para uso!**
