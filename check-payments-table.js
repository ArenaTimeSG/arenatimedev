// Verificar se o pagamento está na tabela payments
const checkPaymentsTable = async () => {
  const supabaseUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  try {
    console.log('🔍 Verificando tabela payments...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/payments?select=*&order=created_at.desc&limit=10`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📄 Dados da tabela payments:', JSON.stringify(data, null, 2));
      
      if (data && data.length > 0) {
        console.log('🔍 Pagamentos encontrados:');
        data.forEach((payment, index) => {
          console.log(`\n${index + 1}. Payment ID: ${payment.id}`);
          console.log(`   - Preference ID: ${payment.mercado_pago_preference_id}`);
          console.log(`   - Status: ${payment.status}`);
          console.log(`   - Appointment ID: ${payment.appointment_id}`);
          console.log(`   - Created: ${payment.created_at}`);
        });
        
        // Verificar se o preference_id específico está na lista
        const targetPreferenceId = '620810417-77e41521-5eb7-43df-9a04-f1978797526f';
        const foundPayment = data.find(p => p.mercado_pago_preference_id === targetPreferenceId);
        
        if (foundPayment) {
          console.log(`\n✅ Preference ID encontrado: ${targetPreferenceId}`);
          console.log(`   - Status: ${foundPayment.status}`);
          console.log(`   - Appointment ID: ${foundPayment.appointment_id}`);
        } else {
          console.log(`\n❌ Preference ID NÃO encontrado: ${targetPreferenceId}`);
        }
      } else {
        console.log('❌ Nenhum pagamento encontrado na tabela payments!');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao buscar payments:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar payments:', error);
  }
};

checkPaymentsTable();
