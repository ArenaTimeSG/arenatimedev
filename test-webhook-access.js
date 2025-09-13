// Testar se o webhook está acessível
const testWebhookAccess = async () => {
  const webhookUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook';
  
  try {
    console.log('🧪 Testando acesso ao webhook...');
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
      console.log('✅ Webhook está acessível e funcionando!');
    } else if (response.status === 401) {
      console.log('❌ Webhook retornando 401 - Problema de autenticação');
    } else {
      console.log('⚠️ Webhook retornando status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
  }
};

testWebhookAccess();
