// Testar com o preference_id atual do console
const testCurrentPayment = async () => {
  const functionUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/check-payment-status-simple';
  const authKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  // Usar o preference_id atual do console
  const currentPreferenceId = '620810417-f75b5d89-30e9-4d4c-80f3-7745de54645a';
  
  const testData = {
    preference_id: currentPreferenceId
  };

  try {
    console.log('🧪 Testando com preference_id atual...');
    console.log('📤 Preference ID:', currentPreferenceId);
    
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
      console.log('📊 Status do pagamento:', data.status);
      console.log('📊 Appointment ID:', data.appointment_id);
    } else {
      console.log('❌ Função com erro:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função:', error);
  }
};

testCurrentPayment();
