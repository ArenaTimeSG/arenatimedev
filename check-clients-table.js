// Verificar se existem clientes na tabela
const checkClientsTable = async () => {
  const supabaseUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  try {
    console.log('🔍 Verificando tabela clients...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/clients?select=*&limit=5`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📄 Clientes encontrados:', data.length);
      
      if (data.length > 0) {
        console.log('✅ Clientes disponíveis:');
        data.forEach((client, index) => {
          console.log(`\n${index + 1}. Client ID: ${client.id}`);
          console.log(`   - Nome: ${client.name}`);
          console.log(`   - Email: ${client.email}`);
        });
        
        // Usar o primeiro cliente para teste
        console.log(`\n🎯 Usando cliente ID: ${data[0].id} para teste`);
        return data[0].id;
      } else {
        console.log('❌ Nenhum cliente encontrado na tabela clients!');
        return null;
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao buscar clients:', errorText);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar clients:', error);
    return null;
  }
};

checkClientsTable();
