# Correção do Problema de Cadastro e Login de Clientes

## Problema Identificado

O sistema ArenaTime apresenta erro **"new row violates row-level security policy for table 'booking_clients'"** ao tentar cadastrar ou fazer login de clientes no módulo de agendamento online.

### Causa Raiz

O sistema possui **dois tipos de autenticação diferentes**:

1. **Administradores**: Usam Supabase Auth (`auth.uid()`)
2. **Clientes Online**: Usam sistema próprio com localStorage (sem `auth.uid()`)

As políticas RLS (Row Level Security) da tabela `booking_clients` estão configuradas para exigir `auth.uid() = user_id`, mas o sistema de clientes online não possui `auth.uid()` porque não usa autenticação do Supabase.

## Solução

### Passo 1: Executar Script SQL no Supabase

Execute o script `fix_client_online_auth.sql` no Supabase Dashboard:

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Cole o conteúdo do arquivo `fix_client_online_auth.sql`
4. Execute o script

### Passo 2: Verificar se a Correção Funcionou

Após executar o script:

1. Acesse a URL de cadastro de clientes: `https://arenatime.vercel.app/cliente/register`
2. Tente cadastrar um novo cliente
3. Verifique se não há mais erro de "row-level security policy"

### Passo 3: Testar Login

1. Acesse a URL de login de clientes: `https://arenatime.vercel.app/cliente/login`
2. Tente fazer login com um cliente existente
3. Verifique se o login funciona corretamente

## O que o Script Faz

O script `fix_client_online_auth.sql`:

1. **Remove todas as políticas RLS existentes** que exigem `auth.uid()`
2. **Cria novas políticas RLS** que permitem:
   - Cadastro público de clientes (sem necessidade de autenticação Supabase)
   - Login público de clientes (visualização pública)
   - Atualização pelos próprios clientes
   - Exclusão pelos próprios clientes
3. **Mantém a coluna `user_id`** como opcional para compatibilidade com administradores
4. **Cria índices** para melhor performance

## Arquivos Criados

- `fix_client_online_auth.sql` - Script principal para corrigir as políticas RLS
- `fix_client_auth_rls.sql` - Script alternativo (mais genérico)

## Verificação Final

Após executar o script, o sistema deve:

✅ Permitir cadastro de novos clientes online  
✅ Permitir login de clientes existentes  
✅ Manter funcionamento do sistema de administradores  
✅ Preservar segurança dos dados  

## Próximos Passos

1. Execute o script SQL no Supabase
2. Teste o cadastro de clientes
3. Teste o login de clientes
4. Se houver problemas, verifique os logs do console do navegador
5. Reporte qualquer erro adicional encontrado
