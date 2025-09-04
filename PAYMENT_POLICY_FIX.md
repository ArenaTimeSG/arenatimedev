# Correção do Erro de Política de Pagamento

## Problema
O erro "Não foi possível atualizar a política de pagamento" ocorre porque o campo `payment_policy` não existe na tabela `settings` do banco de dados.

## Soluções

### Opção 1: Executar Migração via Supabase (Recomendado)
1. Abra o painel do Supabase (https://supabase.com)
2. Vá para o seu projeto
3. Acesse "SQL Editor"
4. Execute o script `apply_payment_policy_migration.sql`

### Opção 2: Reset do Banco Local (se usando Docker)
```bash
# No terminal, dentro da pasta do projeto
npx supabase db reset
```

### Opção 3: Aplicar Migração Manualmente
Se você tem acesso direto ao banco de dados, execute:

```sql
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS payment_policy VARCHAR(20) NOT NULL DEFAULT 'sem_pagamento' 
CHECK (payment_policy IN ('sem_pagamento', 'obrigatorio', 'opcional'));

UPDATE public.settings 
SET payment_policy = 'sem_pagamento' 
WHERE payment_policy IS NULL;
```

## Solução Temporária
Enquanto a migração não é aplicada, o sistema:
- Salva a configuração no localStorage do navegador
- Exibe uma mensagem informativa sobre o problema
- Continua funcionando normalmente

## Verificação
Após aplicar a migração:
1. Recarregue a página de configurações
2. Tente alterar a política de pagamento
3. O erro não deve mais aparecer

## Estrutura do Campo
- **Nome**: `payment_policy`
- **Tipo**: VARCHAR(20)
- **Valores permitidos**: 
  - `sem_pagamento` (padrão)
  - `obrigatorio`
  - `opcional`
- **Restrição**: NOT NULL com valor padrão
