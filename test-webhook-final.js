// Testar webhook final
const testWebhookFinal = async () => {
  const webhookUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook-final';
  
  try {
    console.log('🧪 Testando webhook final...');
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
      console.log('✅ Webhook final funcionando!');
      console.log('🎉 Agora o Mercado Pago pode acessar o webhook!');
    } else if (response.status === 401) {
      console.log('❌ Webhook final ainda com problema de autenticação:', response.status);
    } else {
      console.log('⚠️ Webhook final retornando status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook final:', error);
  }
};

testWebhookFinal();
