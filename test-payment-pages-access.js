const https = require('https');

async function testPageAccess(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`📊 ${url} - Status: ${res.statusCode}`);
      resolve(res.statusCode);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url} - Erro: ${err.message}`);
      resolve(null);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${url} - Timeout`);
      req.destroy();
      resolve(null);
    });
  });
}

async function testPaymentPages() {
  console.log('🧪 Testando acesso às páginas de pagamento...\n');
  
  const pages = [
    'https://arenatime.vercel.app/payment/success',
    'https://arenatime.vercel.app/payment/failure', 
    'https://arenatime.vercel.app/payment/pending'
  ];
  
  for (const page of pages) {
    await testPageAccess(page);
  }
  
  console.log('\n✅ Teste concluído!');
}

testPaymentPages();
