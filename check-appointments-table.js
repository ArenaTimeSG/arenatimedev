// Verificar se existem agendamentos na tabela
const checkAppointmentsTable = async () => {
  const supabaseUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M';
  
  try {
    console.log('🔍 Verificando tabela appointments...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/appointments?select=*&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📄 Agendamentos encontrados:', data.length);
      
      if (data.length > 0) {
        console.log('✅ Agendamentos disponíveis:');
        data.forEach((appointment, index) => {
          console.log(`\n${index + 1}. Appointment ID: ${appointment.id}`);
          console.log(`   - Client ID: ${appointment.client_id}`);
          console.log(`   - Status: ${appointment.status}`);
          console.log(`   - Payment Status: ${appointment.payment_status}`);
          console.log(`   - Created: ${appointment.created_at}`);
        });
      } else {
        console.log('❌ Nenhum agendamento encontrado na tabela appointments!');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao buscar appointments:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar appointments:', error);
  }
};

checkAppointmentsTable();
