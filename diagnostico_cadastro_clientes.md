# Diagnóstico - Erro ao Cadastrar Clientes pelo Painel Admin

## Problemas Identificados e Soluções

### 1. **Problema no AddClientModal.tsx**
- **Erro**: Variável `user` não estava definida na linha 68
- **Solução**: Adicionado `import { useAuth } from '@/hooks/useAuth'` e `const { user } = useAuth()`

### 2. **Possível Problema de Constraint de Email**
- **Erro**: Constraint global de email único pode estar causando conflitos
- **Solução**: Executar o script `fix_email_constraint.sql`

### 3. **Scripts de Diagnóstico Criados**
- `test_client_creation.sql` - Para verificar estrutura da tabela e constraints
- `fix_email_constraint.sql` - Para corrigir constraint de email

## Passos para Resolver

### Passo 1: Executar Script de Correção de Constraint
```sql
-- Executar no Supabase Dashboard
ALTER TABLE booking_clients DROP CONSTRAINT IF EXISTS booking_clients_email_key;
ALTER TABLE booking_clients ADD CONSTRAINT booking_clients_email_user_id_key UNIQUE (email, user_id);
```

### Passo 2: Verificar Estrutura da Tabela
```sql
-- Executar no Supabase Dashboard
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'booking_clients' 
ORDER BY ordinal_position;
```

### Passo 3: Testar Criação de Cliente
1. Ir para o painel admin
2. Tentar criar um novo cliente
3. Verificar se o erro persiste

## Arquivos Modificados
- ✅ `src/components/AddClientModal.tsx` - Corrigido import e uso do hook useAuth
- ✅ `fix_email_constraint.sql` - Script para corrigir constraint
- ✅ `test_client_creation.sql` - Script de diagnóstico

## Próximos Passos
1. Executar o script SQL no Supabase
2. Testar criação de cliente no painel admin
3. Se o erro persistir, verificar logs do console do navegador
