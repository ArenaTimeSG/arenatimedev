// Teste da função create-payment-preference
const testCreatePaymentPreference = async () => {
  const functionUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/create-payment-preference';
  const authKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  const testData = {
    user_id: '49014464-6ed9-4fee-af45-06105f31698b', // ID do Pedro Junior
    amount: 1.00,
    description: 'Agendamento de Vôlei',
    client_name: 'Pedro Junior Greef Flores',
    client_email: 'pedrogreef06@gmail.com',
    appointment_data: {
      client_id: 'test-client-id',
      modality_id: 'test-modality-id',
      date: '2025-09-13',
      time: '14:00',
      valor_total: 1.00,
      status: 'pending',
      booking_source: 'online',
      user_id: '49014464-6ed9-4fee-af45-06105f31698b'
    }
  };

  try {
    console.log('🧪 Testando create-payment-preference...');
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
      console.log('✅ Função funcionando!');
      console.log('📊 Preference ID:', data.preference_id);
      console.log('📊 Init Point:', data.init_point);
      
      // Verificar se o pagamento foi salvo na tabela
      console.log('\n🔍 Verificando se pagamento foi salvo...');
      await checkPaymentsTable();
    } else {
      console.log('❌ Função com erro:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função:', error);
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
        console.log('✅ Pagamento salvo com sucesso!');
        console.log('📊 Último pagamento:', data[0]);
      } else {
        console.log('❌ Nenhum pagamento encontrado na tabela');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
  }
};

testCreatePaymentPreference();
