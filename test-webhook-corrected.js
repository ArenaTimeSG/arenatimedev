// Testar webhook corrigido
const testWebhookCorrected = async () => {
  console.log('🧪 Testando webhook corrigido...');
  
  const webhookData = {
    topic: 'payment',
    resource: 'https://api.mercadopago.com/v1/payments/128316282356',
    type: 'payment'
  };
  
  try {
    console.log('📡 Enviando webhook...');
    
    const response = await fetch('https://xjsovawofsibcolnrgxl.supabase.co/functions/v1/notification-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U'
      },
      body: JSON.stringify(webhookData)
    });
    
    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Webhook processado com sucesso!');
      
      // Aguardar processamento
      console.log('⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se criou agendamento duplicado
      const checkResponse = await fetch('https://xjsovawofsibcolnrgxl.supabase.co/rest/v1/appointments?user_id=eq.e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f&order=created_at.desc&limit=5', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U'
        }
      });
      
      if (checkResponse.ok) {
        const appointments = await checkResponse.json();
        console.log('📋 Últimos agendamentos:', appointments.length);
        
        // Verificar duplicação por data
        const appointmentsByDate = {};
        appointments.forEach(apt => {
          const dateKey = apt.date;
          if (!appointmentsByDate[dateKey]) {
            appointmentsByDate[dateKey] = [];
          }
          appointmentsByDate[dateKey].push(apt);
        });
        
        console.log('🔍 Verificando duplicação:');
        Object.keys(appointmentsByDate).forEach(date => {
          const aptsForDate = appointmentsByDate[date];
          if (aptsForDate.length > 1) {
            console.log(`⚠️ DUPLICAÇÃO encontrada para ${date}:`, aptsForDate.length, 'agendamentos');
            aptsForDate.forEach(apt => {
              console.log(`  - ID: ${apt.id}, Status: ${apt.status}, Cliente: ${apt.client_id}`);
            });
          } else {
            console.log(`✅ OK para ${date}: 1 agendamento`);
          }
        });
      }
      
    } else {
      console.log('❌ Erro no webhook:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

testWebhookCorrected();
