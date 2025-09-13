// Testar se as páginas de pagamento estão funcionando
const testPaymentPages = async () => {
  const baseUrl = 'http://localhost:5173';
  const pages = ['/payment/success', '/payment/failure', '/payment/pending'];
  
  console.log('🧪 Testando páginas de pagamento...');
  
  for (const page of pages) {
    try {
      console.log(`\n📄 Testando: ${baseUrl}${page}`);
      
      const response = await fetch(`${baseUrl}${page}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ Página acessível');
      } else {
        console.log('❌ Página com problema');
      }
      
    } catch (error) {
      console.log(`❌ Erro ao acessar ${page}:`, error.message);
    }
  }
  
  console.log('\n🔍 Verificações:');
  console.log('1. O servidor de desenvolvimento está rodando? (npm run dev)');
  console.log('2. As rotas estão configuradas no App.tsx?');
  console.log('3. As páginas foram criadas corretamente?');
};

testPaymentPages();
