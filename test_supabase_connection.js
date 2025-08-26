// =====================================================
// TESTE DE CONECTIVIDADE COM SUPABASE
// Execute este script no browser console para testar
// =====================================================

const SUPABASE_URL = "https://xtufbfvrgpzqbvdfmtiy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M";

console.log('🔍 Testando conectividade com Supabase...');

// Teste 1: Verificar se a URL está acessível
async function testUrlAccess() {
  try {
    console.log('📡 Testando acesso à URL do Supabase...');
    const response = await fetch(SUPABASE_URL, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    });
    
    console.log('✅ URL acessível:', response.status, response.statusText);
    return true;
  } catch (error) {
    console.error('❌ Erro ao acessar URL:', error);
    return false;
  }
}

// Teste 2: Verificar se a API está funcionando
async function testApiAccess() {
  try {
    console.log('🔌 Testando acesso à API do Supabase...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=count`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ API acessível:', response.status, response.statusText);
    return true;
  } catch (error) {
    console.error('❌ Erro ao acessar API:', error);
    return false;
  }
}

// Teste 3: Verificar se as tabelas estão acessíveis
async function testTableAccess() {
  try {
    console.log('📊 Testando acesso às tabelas...');
    
    // Testar user_profiles
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ user_profiles acessível:', userResponse.status);
    
    // Testar booking_clients
    const clientResponse = await fetch(`${SUPABASE_URL}/rest/v1/booking_clients?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ booking_clients acessível:', clientResponse.status);
    
    // Testar appointments
    const appointmentResponse = await fetch(`${SUPABASE_URL}/rest/v1/appointments?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ appointments acessível:', appointmentResponse.status);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao acessar tabelas:', error);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando testes de conectividade...\n');
  
  const urlTest = await testUrlAccess();
  console.log('');
  
  const apiTest = await testApiAccess();
  console.log('');
  
  const tableTest = await testTableAccess();
  console.log('');
  
  if (urlTest && apiTest && tableTest) {
    console.log('🎉 Todos os testes passaram! O Supabase está funcionando corretamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique a configuração do Supabase.');
  }
}

// Executar os testes
runAllTests();
