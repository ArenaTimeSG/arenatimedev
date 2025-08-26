// =====================================================
// TESTE SIMPLES DE CONECTIVIDADE - DIGITE MANUALMENTE
// =====================================================

// Teste 1: Verificar se o Supabase está acessível
fetch('https://xtufbfvrgpzqbvdfmtiy.supabase.co')
  .then(response => {
    console.log('✅ Supabase acessível:', response.status);
  })
  .catch(error => {
    console.error('❌ Erro ao acessar Supabase:', error);
  });

// Teste 2: Verificar se a API está funcionando
fetch('https://xtufbfvrgpzqbvdfmtiy.supabase.co/rest/v1/user_profiles?select=count', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M'
  }
})
.then(response => {
  console.log('✅ API funcionando:', response.status);
})
.catch(error => {
  console.error('❌ Erro na API:', error);
});
