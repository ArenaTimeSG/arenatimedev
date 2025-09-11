// Script de debug para testar o modal de agendamento
// Execute este código no console do navegador quando estiver no dashboard

console.log('🔍 Iniciando debug do modal de agendamento...');

// Verificar se os componentes estão carregados
const checkComponents = () => {
  console.log('📋 Verificando componentes...');
  
  // Verificar se o modal está no DOM
  const modal = document.querySelector('[role="dialog"]');
  console.log('Modal encontrado:', modal ? '✅' : '❌');
  
  // Verificar se o AddClientModal está no DOM
  const addClientModal = document.querySelector('[data-testid="add-client-modal"]');
  console.log('AddClientModal encontrado:', addClientModal ? '✅' : '❌');
  
  // Verificar se o ClientSearchDropdown está no DOM
  const clientDropdown = document.querySelector('[data-testid="client-search-dropdown"]');
  console.log('ClientSearchDropdown encontrado:', clientDropdown ? '✅' : '❌');
};

// Verificar se há erros no console
const checkConsoleErrors = () => {
  console.log('🚨 Verificando erros no console...');
  
  // Interceptar erros
  const originalError = console.error;
  console.error = function(...args) {
    console.log('❌ ERRO CAPTURADO:', args);
    originalError.apply(console, args);
  };
  
  // Interceptar warnings
  const originalWarn = console.warn;
  console.warn = function(...args) {
    console.log('⚠️ WARNING CAPTURADO:', args);
    originalWarn.apply(console, args);
  };
};

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

// Verificar se há clientes carregados
const checkClients = async (user) => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('booking_clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      return;
    }
    
    console.log('✅ Clientes carregados:', data?.length || 0);
    console.log('📋 Lista de clientes:', data);
  } catch (error) {
    console.error('❌ Erro inesperado ao carregar clientes:', error);
  }
};

// Executar todas as verificações
const runDebug = async () => {
  console.log('🚀 Iniciando debug completo...');
  
  checkComponents();
  checkConsoleErrors();
  
  const user = await checkAuth();
  await checkClients(user);
  
  console.log('✅ Debug completo finalizado');
};

// Executar quando chamado
runDebug();
