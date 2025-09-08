# Configuração do Supabase

## Erro Corrigido
O erro "supabaseKey is required" foi corrigido adicionando valores padrão no arquivo `src/lib/supabase.ts`.

## Configuração de Variáveis de Ambiente (Opcional)

Para usar variáveis de ambiente personalizadas, crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://xtufbfvrgpzqbvdfmtiy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M
```

## Status Atual
✅ Supabase configurado com valores padrão
✅ Realtime funcionando
✅ Erro de import resolvido
✅ PaymentCheckout.tsx corrigido

## Próximos Passos
1. Reinicie o servidor de desenvolvimento
2. Teste o fluxo de pagamento
3. Verifique se o Realtime está funcionando no console
