// Testar webhook do Mercado Pago
const testMercadoPagoWebhook = async () => {
  const webhookUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado_pago_webhook';
  
  try {
    console.log('🧪 Testando webhook do Mercado Pago...');
    console.log('📤 URL:', webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'payment',
        data: {
          id: '123456789'
        }
      })
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Resposta:', responseText);
    
    if (response.status === 200) {
      console.log('✅ Webhook do Mercado Pago funcionando!');
      console.log('🎉 Agora o Mercado Pago pode acessar o webhook!');
    } else if (response.status === 401) {
      console.log('❌ Webhook ainda com problema de autenticação:', response.status);
    } else {
      console.log('⚠️ Webhook retornando status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
  }
};

testMercadoPagoWebhook();
