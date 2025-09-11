// Script de debug para testar cadastro de cliente
// Execute este código no console do navegador quando estiver na página de clientes

console.log('🔍 Iniciando teste de cadastro de cliente...');

// Verificar se o usuário está autenticado
const checkAuth = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      return null;
    }
    console.log('✅ Usuário autenticado:', user?.id);
    return user;
  } catch (error) {
    console.error('❌ Erro na verificação de auth:', error);
    return null;
  }
};

// Testar inserção de cliente
const testClientCreation = async (user) => {
  if (!user) {
    console.error('❌ Usuário não autenticado');
    return;
  }

  const testData = {
    name: 'Cliente Teste Debug',
    email: `teste_debug_${Date.now()}@exemplo.com`,
    phone: '11999999999',
    password_hash: 'temp_hash',
    user_id: user.id
  };

  console.log('🧪 Testando inserção com dados:', testData);

  try {
    const { data, error } = await supabase
      .from('booking_clients')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro na inserção:', error);
      console.error('❌ Código do erro:', error.code);
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Detalhes:', error.details);
    } else {
      console.log('✅ Cliente criado com sucesso:', data);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
};

// Executar teste
const runTest = async () => {
  const user = await checkAuth();
  await testClientCreation(user);
};

// Executar quando chamado
runTest();
