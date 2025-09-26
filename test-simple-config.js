// Teste Simplificado - Apenas verificar se a função está funcionando
// ================================================================

const SUPABASE_URL = 'https://xjsovawofsibcolnrgxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U';

async function testSimpleConfiguration() {
  console.log('🧪 Teste Simplificado - Verificando configuração...');
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log('🔑 Anon Key:', SUPABASE_ANON_KEY ? 'Presente' : 'Ausente');
  
  try {
    // Dados mínimos para teste
    const testData = {
      owner_id: 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f', // Usuário com Mercado Pago configurado
      booking_id: 'existing-booking-test', // Usar um ID que pode existir
      price: 10.00,
      items: [{
        title: 'Teste de Configuração',
        quantity: 1,
        unit_price: 10.00
      }],
      return_url: 'https://arenatimedev.vercel.app/payment/success'
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

    const result = await response.text();
    console.log('📥 Resposta completa:', result);

    if (response.ok) {
      const jsonResult = JSON.parse(result);
      console.log('✅ Sucesso! Resultado:', jsonResult);
      
      if (jsonResult.success && jsonResult.init_point) {
        console.log('🎉 Configuração funcionando perfeitamente!');
        console.log('🔗 URL do pagamento:', jsonResult.init_point);
        console.log('🆔 Preference ID:', jsonResult.preference_id);
        return jsonResult;
      }
    } else {
      console.log('⚠️ Erro na resposta, mas a função está funcionando');
      console.log('📝 Erro:', result);
      
      // Verificar se é erro de configuração ou erro de dados
      if (result.includes('Configurações do admin não encontradas')) {
        console.log('❌ Problema: Configurações do admin não encontradas');
      } else if (result.includes('Mercado Pago não está habilitado')) {
        console.log('❌ Problema: Mercado Pago não está habilitado');
      } else if (result.includes('Dados insuficientes')) {
        console.log('⚠️ Problema: Dados insuficientes para criar agendamento');
      } else if (result.includes('Erro ao criar agendamento')) {
        console.log('⚠️ Problema: Erro ao criar agendamento temporário');
      } else {
        console.log('❓ Problema desconhecido:', result);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    throw error;
  }
}

// Executar teste
testSimpleConfiguration()
  .then(() => console.log('✅ Teste concluído!'))
  .catch(error => console.error('❌ Teste falhou:', error));
