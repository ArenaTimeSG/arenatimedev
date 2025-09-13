// Teste para verificar se as páginas de redirecionamento estão funcionando
const https = require('https');

function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${url} - Status: ${res.statusCode}`);
        if (data.includes('Payment Success') || data.includes('Payment Failure') || data.includes('Payment Pending')) {
          console.log(`   ✅ Página de pagamento encontrada!`);
        } else {
          console.log(`   ⚠️ Página não é de pagamento`);
        }
        resolve(res.statusCode);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url} - Erro: ${err.message}`);
      resolve(null);
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ ${url} - Timeout`);
      req.destroy();
      resolve(null);
    });
  });
}

async function testPaymentPages() {
  console.log('🧪 Testando páginas de redirecionamento do Mercado Pago...\n');
  
  const pages = [
    'https://arenatime.vercel.app/payment/success',
    'https://arenatime.vercel.app/payment/failure', 
    'https://arenatime.vercel.app/payment/pending'
  ];
  
  for (const page of pages) {
    await testUrl(page);
  }
  
  console.log('\n🔍 Verificando se o problema é com o redirecionamento...');
  console.log('📋 URLs que o Mercado Pago deve redirecionar:');
  pages.forEach(page => console.log(`   - ${page}`));
  
  console.log('\n💡 Se as páginas retornam 404, o problema é que o deploy não incluiu as novas páginas.');
  console.log('💡 Se as páginas retornam 200, o problema é que o Mercado Pago não está redirecionando.');
}

testPaymentPages();
