// Verificar se um cliente específico existe
const checkSpecificClient = async () => {
  const supabaseUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  const clientId = '288a39da-dd94-4835-ada6-f0f942533484';
  
  try {
    console.log(`🔍 Verificando cliente específico: ${clientId}`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📄 Cliente encontrado:', data.length > 0 ? 'SIM' : 'NÃO');
      
      if (data.length > 0) {
        console.log('✅ Cliente existe:');
        console.log('   - ID:', data[0].id);
        console.log('   - Nome:', data[0].name);
        console.log('   - Email:', data[0].email);
      } else {
        console.log('❌ Cliente não encontrado na tabela clients!');
        console.log('🔍 Isso explica por que não conseguimos criar o pagamento.');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao buscar cliente:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar cliente:', error);
  }
};

checkSpecificClient();
