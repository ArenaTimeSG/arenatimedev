// Verificar estrutura da tabela payments
const checkPaymentsSchema = async () => {
  const supabaseUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  try {
    console.log('🔍 Verificando estrutura da tabela payments...');
    
    // Tentar fazer uma query simples para ver a estrutura
    const response = await fetch(`${supabaseUrl}/rest/v1/payments?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📄 Estrutura da tabela payments:');
      console.log('   - Tabela existe e está acessível');
      console.log('   - Dados retornados:', data);
      
      if (data.length > 0) {
        console.log('   - Colunas disponíveis:', Object.keys(data[0]));
      } else {
        console.log('   - Tabela vazia, mas existe');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao acessar tabela:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar schema:', error);
  }
};

checkPaymentsSchema();
