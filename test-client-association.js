// Testar associação correta de cliente
const testClientAssociation = async () => {
  console.log('👤 Testando associação de cliente...');
  
  try {
    // Verificar agendamentos recentes
    const response = await fetch('https://xjsovawofsibcolnrgxl.supabase.co/rest/v1/appointments?user_id=eq.e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f&order=created_at.desc&limit=3', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U'
      }
    });
    
    if (response.ok) {
      const appointments = await response.json();
      console.log('📋 Agendamentos recentes:', appointments.length);
      
      for (const apt of appointments) {
        console.log(`\n📅 Agendamento: ${apt.id}`);
        console.log(`  - Data: ${apt.date}`);
        console.log(`  - Status: ${apt.status}`);
        console.log(`  - Cliente ID: ${apt.client_id}`);
        console.log(`  - Booking Source: ${apt.booking_source}`);
        
        // Buscar dados do cliente
        if (apt.client_id) {
          const clientResponse = await fetch(`https://xjsovawofsibcolnrgxl.supabase.co/rest/v1/booking_clients?id=eq.${apt.client_id}`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U'
            }
          });
          
          if (clientResponse.ok) {
            const clients = await clientResponse.json();
            if (clients.length > 0) {
              const client = clients[0];
              console.log(`  👤 Cliente: ${client.name} (${client.email})`);
              console.log(`  📞 Telefone: ${client.phone}`);
              console.log(`  🔑 Password Hash: ${client.password_hash === 'temp_hash' ? 'TEMPORÁRIO' : 'REAL'}`);
              console.log(`  ✅ Ativo: ${client.is_active}`);
              
              // Verificar se é o cliente TESTE que funciona
              if (client.email === 'teste@gmail.com') {
                console.log(`  🎯 Este é o cliente TESTE que funciona!`);
              }
            }
          }
        }
      }
      
      // Verificar se há agendamentos para o cliente TESTE
      console.log('\n🔍 Verificando agendamentos do cliente TESTE...');
      const testeResponse = await fetch('https://xjsovawofsibcolnrgxl.supabase.co/rest/v1/booking_clients?email=eq.teste@gmail.com&user_id=eq.e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U'
        }
      });
      
      if (testeResponse.ok) {
        const testeClients = await testeResponse.json();
        if (testeClients.length > 0) {
          const testeClient = testeClients[0];
          console.log(`👤 Cliente TESTE encontrado: ${testeClient.id}`);
          
          // Buscar agendamentos do cliente TESTE
          const testeAptsResponse = await fetch(`https://xjsovawofsibcolnrgxl.supabase.co/rest/v1/appointments?client_id=eq.${testeClient.id}&user_id=eq.e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f&order=created_at.desc&limit=3`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U'
            }
          });
          
          if (testeAptsResponse.ok) {
            const testeApts = await testeAptsResponse.json();
            console.log(`📅 Agendamentos do cliente TESTE: ${testeApts.length}`);
            testeApts.forEach(apt => {
              console.log(`  - ${apt.date} (${apt.status})`);
            });
          }
        } else {
          console.log('❌ Cliente TESTE não encontrado!');
        }
      }
      
    } else {
      console.log('❌ Erro ao buscar agendamentos:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

testClientAssociation();
