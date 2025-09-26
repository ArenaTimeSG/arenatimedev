// Teste de configuração do Mercado Pago - Versão Corrigida
// =========================================================

const SUPABASE_URL = 'https://xjsovawofsibcolnrgxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U';

async function testPaymentConfiguration() {
  console.log('🧪 Testando configuração do Mercado Pago...');
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log('🔑 Anon Key:', SUPABASE_ANON_KEY ? 'Presente' : 'Ausente');
  
  try {
    // Dados de teste
    const testData = {
      owner_id: 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f', // Usuário com Mercado Pago configurado
      booking_id: 'test-booking-' + Date.now(), // ID de teste único
      price: 10.00,
      items: [{
        title: 'Teste de Configuração',
        quantity: 1,
        unit_price: 10.00
      }],
      return_url: 'https://arenatimedev.vercel.app/payment/success',
      client_id: 'b96ce2d9-bfb9-4fd6-b015-815dbed12988', // Cliente existente
      appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
      modality_id: 'test-modality-id'
    };

    console.log('📤 Dados sendo enviados:', testData);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Resultado:', result);
    
    if (result.success && result.init_point) {
      console.log('🎉 Configuração funcionando!');
      console.log('🔗 URL do pagamento:', result.init_point);
      console.log('🆔 Preference ID:', result.preference_id);
      
      // Testar se conseguimos abrir a URL
      console.log('🌐 Testando abertura da URL...');
      if (typeof window !== 'undefined') {
        window.open(result.init_point, '_blank');
      }
      
      return result;
    } else {
      throw new Error('URL de pagamento não foi retornada');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    throw error;
  }
}

// Função para testar webhook
async function testWebhook() {
  console.log('🔗 Testando webhook...');
  
  try {
    const webhookUrl = `${SUPABASE_URL}/functions/v1/notification-webhook`;
    console.log('📤 URL do webhook:', webhookUrl);
    
    const testData = {
      type: 'payment',
      data: {
        id: 'test-payment-' + Date.now(),
        preference_id: 'test-preference-' + Date.now()
      }
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Status do webhook:', response.status);
    const result = await response.text();
    console.log('📥 Resposta do webhook:', result);
    
    return response.ok;
  } catch (error) {
    console.error('❌ Erro no teste do webhook:', error);
    return false;
  }
}

// Executar testes
if (typeof window !== 'undefined') {
  // Browser
  window.testPaymentConfiguration = testPaymentConfiguration;
  window.testWebhook = testWebhook;
  
  console.log('🚀 Testes carregados! Execute:');
  console.log('  - testPaymentConfiguration() para testar criação de preferência');
  console.log('  - testWebhook() para testar webhook');
} else {
  // Node.js
  testPaymentConfiguration()
    .then(() => testWebhook())
    .then(() => console.log('✅ Todos os testes concluídos!'))
    .catch(error => console.error('❌ Teste falhou:', error));
}
