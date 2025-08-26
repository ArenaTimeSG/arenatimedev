# 🚀 Guia para Migração Manual no Supabase

## 📋 Passo a Passo

### **1. Acessar o Supabase Dashboard**

1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto ArenaTime

### **2. Abrir o SQL Editor**

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New query"** (ou **"Nova consulta"**)

### **3. Executar a Migração**

1. **Copie todo o conteúdo** do arquivo `migration_manual.sql`
2. **Cole no SQL Editor** do Supabase
3. Clique no botão **"Run"** (ou **"Executar"**)

### **4. Verificar o Resultado**

Após executar, você deve ver:

#### **Resultado da Verificação 1 (campos):**
```
column_name      | data_type | is_nullable | column_default
-----------------|-----------|-------------|----------------
online_booking   | jsonb     | YES         | {...}
online_enabled   | boolean   | YES         | false
working_hours    | jsonb     | YES         | {...}
```

#### **Resultado da Verificação 2 (dados):**
```
user_id | online_enabled | online_booking | working_hours
--------|----------------|----------------|---------------
...     | false          | {...}          | {...}
```

## ✅ **O que a Migração Faz**

### **1. Adiciona 3 Novos Campos:**

- **`online_enabled`** (boolean): Controla se o agendamento online está ativo
- **`online_booking`** (jsonb): Configurações específicas do agendamento online
- **`working_hours`** (jsonb): Horários de funcionamento

### **2. Define Valores Padrão:**

- **online_enabled**: `false` (desativado por padrão)
- **online_booking**: Auto-agendamento desativado, 24h antecedência, 60min duração
- **working_hours**: Horários padrão de segunda a sábado (8h-18h)

### **3. Atualiza Registros Existentes:**

- Preenche campos vazios com valores padrão
- Não afeta dados já existentes

## 🔍 **Verificação Adicional (Opcional)**

Se quiser verificar se tudo funcionou, execute esta consulta:

```sql
-- Verificar estrutura completa da tabela settings
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'settings'
ORDER BY ordinal_position;
```

## 🚨 **Possíveis Erros e Soluções**

### **Erro: "column already exists"**
- **Solução**: Normal, significa que o campo já existe. Continue com o próximo passo.

### **Erro: "permission denied"**
- **Solução**: Verifique se você tem permissões de administrador no projeto.

### **Erro: "table does not exist"**
- **Solução**: Verifique se a tabela `settings` existe no seu projeto.

## 🎯 **Próximos Passos**

Após executar a migração com sucesso:

1. **Teste o sistema**: Acesse as configurações do administrador
2. **Verifique a aba "Agendamento Online"**: Deve aparecer o toggle
3. **Teste ativar/desativar**: As mudanças devem ser salvas
4. **Teste o link de agendamento**: Deve funcionar conforme o status

## 📞 **Suporte**

Se encontrar problemas:

1. **Verifique os logs** no SQL Editor
2. **Confirme a estrutura** da tabela settings
3. **Teste uma consulta simples**:
   ```sql
   SELECT * FROM settings LIMIT 1;
   ```

---

**✅ Migração concluída! Agora o sistema de agendamento online deve funcionar corretamente.**
