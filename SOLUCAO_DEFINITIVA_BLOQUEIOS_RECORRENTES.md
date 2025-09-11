# Solução Definitiva para Exclusão de Bloqueios Recorrentes

## 🔍 Problema Identificado

O sistema estava removendo **todos** os bloqueios do mesmo horário ao excluir uma recorrência, porque:

1. **Falta de campos no banco de dados**: A tabela `time_blockades` não tinha campos para armazenar informações de recorrência
2. **Dependência do localStorage**: A lógica dependia apenas do localStorage, que pode ser inconsistente
3. **Identificação incorreta**: Não havia como distinguir entre diferentes recorrências do mesmo horário

## ✅ Solução Implementada

### 1. Migração do Banco de Dados

**Arquivo**: `apply_recurrence_migration.sql`

Adicionados os seguintes campos à tabela `time_blockades`:
- `is_recurring` (BOOLEAN) - Indica se é parte de uma série recorrente
- `recurrence_type` (VARCHAR) - Tipo: 'daily', 'weekly', 'monthly'
- `original_date` (DATE) - Data original da recorrência
- `end_date` (DATE) - Data final da recorrência
- `is_indefinite` (BOOLEAN) - Se a recorrência é indefinida

### 2. Atualização da Função de Criação de Bloqueios

**Arquivo**: `src/hooks/useWorkingHours.ts` - Função `blockTimeSlot`

Agora salva os dados de recorrência no banco de dados:
```typescript
{
  user_id: user.id,
  date: dateStr,
  time_slot: timeSlot,
  reason: blockadeInfo.reason,
  description: blockadeInfo.description || null,
  is_recurring: blockadeInfo.isRecurring || false,
  recurrence_type: blockadeInfo.recurrenceType || null,
  original_date: blockadeInfo.originalDate || null,
  end_date: blockadeInfo.endDate || null,
  is_indefinite: blockadeInfo.isIndefinite || false
}
```

### 3. Correção da Função de Exclusão

**Arquivo**: `src/hooks/useWorkingHours.ts` - Função `unblockTimeSlot`

Nova lógica que identifica corretamente os bloqueios da mesma recorrência:

```typescript
// Para bloqueios semanais
case 'weekly':
  const originalDayOfWeek = new Date(originalDate).getDay();
  const blockadeDayOfWeek = new Date(blockade.date).getDay();
  return blockade.date >= originalDate && originalDayOfWeek === blockadeDayOfWeek;
```

## 🎯 Como Funciona Agora

### Cenário de Teste:
- **Segunda-feira 22/09 às 11:00** - Bloqueio recorrente semanal (original_date: 22/09)
- **Segunda-feira 29/09 às 11:00** - Bloqueio da recorrência (original_date: 22/09)
- **Terça-feira 23/09 às 11:00** - Bloqueio recorrente semanal (original_date: 23/09)
- **Terça-feira 30/09 às 11:00** - Bloqueio da recorrência (original_date: 23/09)

### Exclusão da Recorrência da Segunda-feira:
1. Sistema identifica que o bloqueio original tem `original_date: 22/09` e `recurrence_type: 'weekly'`
2. Busca todos os bloqueios às 11:00 a partir de 22/09
3. Filtra apenas os que têm `original_date: 22/09` E são do mesmo dia da semana (segunda-feira)
4. Remove apenas os bloqueios das segundas-feiras às 11:00
5. **Preserva** os bloqueios das terças-feiras às 11:00 ✅

## 📋 Passos para Aplicar a Correção

### 1. Aplicar a Migração no Banco de Dados
Execute o script `apply_recurrence_migration.sql` no SQL Editor do Supabase.

### 2. Verificar se a Migração Foi Aplicada
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'time_blockades' 
AND column_name IN ('is_recurring', 'recurrence_type', 'original_date');
```

### 3. Testar a Funcionalidade
1. Crie um bloqueio recorrente semanal (ex: segunda-feira às 11:00)
2. Crie outro bloqueio recorrente em dia diferente (ex: terça-feira às 11:00)
3. Exclua a recorrência da segunda-feira
4. Verifique que apenas os bloqueios das segundas-feiras foram removidos

## 🔧 Logs de Debug

A função agora inclui logs detalhados para facilitar o debug:
```typescript
console.log('🔍 Bloqueios identificados para remoção:', blockadesToRemove.length);
console.log('🔍 Detalhes dos bloqueios para remoção:', blockadesToRemove.map(b => ({
  date: b.date,
  time_slot: b.time_slot,
  is_recurring: b.is_recurring,
  recurrence_type: b.recurrence_type,
  original_date: b.original_date
})));
```

## 📁 Arquivos Modificados

1. `supabase/migrations/20250125000001_add_recurrence_fields_to_time_blockades.sql` - Migração
2. `apply_recurrence_migration.sql` - Script para aplicar a migração
3. `src/hooks/useWorkingHours.ts` - Lógica corrigida
4. `SOLUCAO_DEFINITIVA_BLOQUEIOS_RECORRENTES.md` - Esta documentação

## ✅ Resultado Esperado

Após aplicar a correção:
- ✅ Exclusão de recorrências remove apenas os bloqueios da mesma série
- ✅ Bloqueios independentes do mesmo horário são preservados
- ✅ Sistema funciona corretamente para todos os tipos de recorrência
- ✅ Dados de recorrência são persistidos no banco de dados
- ✅ Logs detalhados facilitam o debug
