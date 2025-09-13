// Teste da função de validação de pagamento
const SUPABASE_URL = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZ2cmdwenFiZmRmbXRpeSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM2NzQ4NzQ0LCJleHAiOjIwNTIzMjQ3NDR9.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

async function testValidatePayment() {
  console.log('🧪 Testando função de validação de pagamento...\n');
  
  // Usar um payment_id real do teste anterior
  const testData = {
    payment_id: '1234567890', // ID fictício para teste
    external_reference: 'test-appointment-id',
    preference_id: '620810417-f2c8c320-8a5d-453f-b0e7-38af9a11231a'
  };
  
  console.log('📤 Dados enviados:', testData);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    
    const result = await response.json();
    console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Função de validação funcionando!');
    } else {
      console.log('❌ Erro na função de validação');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função:', error.message);
  }
}

testValidatePayment();
