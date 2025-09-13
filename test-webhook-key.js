// Testar webhook com chave
const testWebhookKey = async () => {
  const webhookUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/mercado-pago-webhook-key';
  
  try {
    console.log('🧪 Testando webhook com chave...');
    console.log('📤 URL:', webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-key': 'mp-webhook-2025-arena-time'
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
      console.log('✅ Webhook com chave funcionando!');
    } else {
      console.log('❌ Webhook com chave ainda com problema:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook com chave:', error);
  }
};

testWebhookKey();
