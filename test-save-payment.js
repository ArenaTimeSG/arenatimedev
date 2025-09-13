// Teste para salvar dados na tabela payments
const testSavePayment = async () => {
  const functionUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/test-save-payment';
  const authKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  const testData = {
    user_id: '49014464-6ed9-4fee-af45-06105f31698b',
    amount: 1.00,
    description: 'Teste de salvamento',
    client_name: 'Pedro Junior Greef Flores',
    client_email: 'pedrogreef06@gmail.com',
    preference_id: 'test-preference-123',
    external_reference: 'test-external-ref-123'
  };

  try {
    console.log('🧪 Testando salvamento na tabela payments...');
    console.log('📤 Dados enviados:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Resposta:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Dados salvos com sucesso!');
      console.log('📊 Payment ID:', data.payment_id);
      
      // Verificar se o pagamento foi salvo na tabela
      console.log('\n🔍 Verificando se pagamento foi salvo...');
      await checkPaymentsTable();
    } else {
      console.log('❌ Erro ao salvar:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar:', error);
  }
};

// Função para verificar tabela payments
const checkPaymentsTable = async () => {
  const supabaseUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/payments?select=*&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📄 Pagamentos na tabela:', data.length);
      if (data.length > 0) {
        console.log('✅ Pagamento encontrado na tabela!');
        console.log('📊 Último pagamento:', data[0]);
      } else {
        console.log('❌ Nenhum pagamento encontrado na tabela');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
  }
};

testSavePayment();
