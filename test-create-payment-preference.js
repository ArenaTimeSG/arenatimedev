// Teste simples para verificar se create-payment-preference está funcionando
const testCreatePaymentPreference = async () => {
  const supabaseUrl = 'https://xjsovawofsibcolnrgxl.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NjQ4MzQsImV4cCI6MjA1MTE0MDgzNH0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

  const testData = {
    owner_id: 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f',
    booking_id: null,
    price: 1.00,
    items: [{
      title: 'Teste - Agendamento',
      quantity: 1,
      unit_price: 1.00
    }],
    return_url: 'https://arenatimedev.vercel.app/payment/success',
    client_id: 'bfb72238-5c21-4277-9b2c-f741499c957b',
    appointment_date: new Date().toISOString(),
    modality_id: 1
  };

  console.log('🧪 Testando create-payment-preference...');
  console.log('📤 Dados enviados:', testData);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Status da resposta:', response.status);
    
    const result = await response.json();
    console.log('📥 Resposta completa:', result);

    if (result.success) {
      console.log('✅ Sucesso! Preference ID:', result.preference_id);
      console.log('✅ Init Point:', result.init_point);
    } else {
      console.error('❌ Erro:', result.error);
      console.error('❌ Detalhes:', result.details);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
};

// Executar o teste
testCreatePaymentPreference();