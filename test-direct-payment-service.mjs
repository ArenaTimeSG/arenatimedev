// Teste da função usando token de serviço
const SUPABASE_URL = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZ2cmdwenFiZmRmbXRpeSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzY3NDg3NDQsImV4cCI6MjA1MjMyNDc0NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testDirectPayment() {
  console.log('🧪 Testando processamento direto de pagamento com token de serviço...\n');
  
  const testData = {
    user_id: '49014464-6ed9-4fee-af45-06105f31698b',
    amount: 1,
    description: 'Teste de pagamento direto',
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
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-payment-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const result = await response.json();
    console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Processamento direto funcionando!');
    } else {
      console.log('❌ Erro no processamento direto');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função:', error.message);
  }
}

testDirectPayment();
