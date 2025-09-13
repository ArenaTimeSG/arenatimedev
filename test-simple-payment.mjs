// Teste da função de processamento simples de pagamento
const SUPABASE_URL = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZ2cmdwenFiZmRmbXRpeSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM2NzQ4NzQ0LCJleHAiOjIwNTIzMjQ3NDR9.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

async function testSimplePayment() {
  console.log('🧪 Testando processamento simples de pagamento...\n');
  
  const testData = {
    user_id: '49014464-6ed9-4fee-af45-06105f31698b',
    amount: 1,
    description: 'Teste de pagamento simples',
    client_name: 'Pedro Junior Greef Flores',
    client_email: 'pedrogreef06@gmail.com',
    payment_method_id: 'pix',
    appointment_data: {
      user_id: '49014464-6ed9-4fee-af45-06105f31698b',
      client_id: 'test-client-id',
      date: '2025-09-13',
      time: '14:00',
      modality_id: 'test-modality-id',
      modality_name: 'Vôlei',
      valor_total: 1,
      status: 'pending'
    }
  };
  
  console.log('📤 Dados enviados:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-payment-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const result = await response.json();
    console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Processamento simples funcionando!');
    } else {
      console.log('❌ Erro no processamento simples');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função:', error.message);
  }
}

testSimplePayment();
