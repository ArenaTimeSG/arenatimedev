// Testar webhook simples
const testSimpleWebhook = async () => {
  const webhookUrl = 'https://xtufbfvrgpzqbvdfmtiy.supabase.co/functions/v1/test-webhook-simple';
  
  try {
    console.log('🧪 Testando webhook simples...');
    console.log('📤 URL:', webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: 'data'
      })
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Resposta:', responseText);
    
    if (response.status === 200) {
      console.log('✅ Webhook simples funcionando!');
    } else {
      console.log('❌ Webhook simples com problema:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook simples:', error);
  }
};

testSimpleWebhook();
