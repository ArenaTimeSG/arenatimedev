// Teste do novo fluxo de pagamento
const testNewPaymentFlow = async () => {
  const functionUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/create-payment-preference';
  const authKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  const testData = {
    user_id: '49014464-6ed9-4fee-af45-06105f31698b',
    amount: 1.00,
    description: 'Teste do novo fluxo',
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
    console.log('🧪 Testando novo fluxo de pagamento...');
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
      console.log('✅ Novo fluxo funcionando!');
      console.log('📊 Preference ID:', data.preference_id);
      console.log('📊 Init Point:', data.init_point);
      
      // Verificar se as URLs de redirecionamento estão corretas
      if (data.init_point) {
        console.log('🔗 URL do checkout:', data.init_point);
        console.log('✅ URLs de redirecionamento configuradas!');
      }
    } else {
      console.log('❌ Erro no novo fluxo:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar novo fluxo:', error);
  }
};

testNewPaymentFlow();
