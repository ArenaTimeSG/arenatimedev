// Testar webhook público
const testPublicWebhook = async () => {
  const webhookUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook-public';
  
  try {
    console.log('🧪 Testando webhook público...');
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
      console.log('✅ Webhook público funcionando!');
      console.log('🎉 Agora o Mercado Pago pode acessar o webhook!');
    } else {
      console.log('❌ Webhook público ainda com problema:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook público:', error);
  }
};

testPublicWebhook();
