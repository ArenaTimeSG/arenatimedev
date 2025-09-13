// Verificar todas as tabelas disponíveis
const checkAllTables = async () => {
  const supabaseUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  const tables = ['clients', 'users', 'profiles', 'customers', 'appointments', 'payments'];
  
  try {
    console.log('🔍 Verificando todas as tabelas...');
    
    for (const table of tables) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Tabela ${table}: ${data.length} registros (acessível)`);
        } else {
          console.log(`❌ Tabela ${table}: Não acessível (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ Tabela ${table}: Erro ao acessar`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
  }
};

checkAllTables();
