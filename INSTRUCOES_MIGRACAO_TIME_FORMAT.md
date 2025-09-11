# 🚀 Instruções para Executar a Migração do time_format_interval

## ❌ **Problema Atual**
O erro `Could not find the 'time_format_interval' column of 'settings' in the schema cache` indica que a coluna não existe no banco de dados.

## ✅ **Solução**

### **Opção 1: Executar no Painel do Supabase (Recomendado)**

1. **Acesse o painel do Supabase:**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta
   - Selecione o projeto `xtufbfvrgpzqbvdfmtiy`

2. **Abra o SQL Editor:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o script:**
   - Copie e cole o conteúdo do arquivo `add_time_format_interval_manual.sql`
   - Clique em "Run" para executar

4. **Verifique se funcionou:**
   - O script deve mostrar "Coluna time_format_interval adicionada com sucesso!"
   - Teste a funcionalidade nas configurações

### **Opção 2: Usar o Supabase CLI (Alternativa)**

Se preferir usar o CLI:

```bash
# Instalar o Supabase CLI
npm install -g supabase

# Linkar o projeto
supabase link --project-ref xtufbfvrgpzqbvdfmtiy

# Executar migrações
supabase db push
```

## 🔍 **Verificação**

Após executar a migração, você deve conseguir:

1. ✅ Acessar a página de Configurações
2. ✅ Ver o toggle "Horários Quebrados (30 min)"
3. ✅ Alternar entre formatos sem erro
4. ✅ Ver horários de 30 em 30 minutos no Dashboard

## 📋 **O que a migração faz:**

- ✅ Adiciona coluna `time_format_interval` na tabela `settings`
- ✅ Define valor padrão como `60` (horários inteiros)
- ✅ Permite valores `30` ou `60`
- ✅ Atualiza registros existentes
- ✅ Adiciona constraint de validação

## 🎯 **Resultado Esperado:**

**Horários Inteiros (60min):**
- 13:00 - 14:00
- 14:00 - 15:00
- 15:00 - 16:00

**Horários Quebrados (30min):**
- 13:00 - 14:00
- 13:30 - 14:30
- 14:00 - 15:00
- 14:30 - 15:30
- 15:00 - 16:00
- 15:30 - 16:30
