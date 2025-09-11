// Script de debug específico para o AddClientModal dentro do NewAppointmentModal
// Execute este código no console do navegador quando estiver no dashboard

console.log('🔍 Debug específico do AddClientModal...');

// Verificar se o AddClientModal está sendo renderizado corretamente
const checkAddClientModal = () => {
  console.log('📋 Verificando AddClientModal...');
  
  // Procurar por todos os modais no DOM
  const allModals = document.querySelectorAll('[role="dialog"]');
  console.log('Total de modais encontrados:', allModals.length);
  
  allModals.forEach((modal, index) => {
    console.log(`Modal ${index + 1}:`, modal);
    
    // Verificar se é o AddClientModal
    const title = modal.querySelector('[data-testid="dialog-title"], h2, h3');
    if (title) {
      console.log(`Título do modal ${index + 1}:`, title.textContent);
      
      if (title.textContent.includes('Adicionar') || title.textContent.includes('Cliente')) {
        console.log('✅ AddClientModal encontrado!');
        
        // Verificar campos do formulário
        const nameField = modal.querySelector('input[type="text"]');
        const emailField = modal.querySelector('input[type="email"]');
        const phoneField = modal.querySelector('input[type="tel"]');
        const checkbox = modal.querySelector('input[type="checkbox"]');
        const submitButton = modal.querySelector('button[type="submit"]');
        
        console.log('Campos encontrados:');
        console.log('- Nome:', nameField ? '✅' : '❌');
        console.log('- Email:', emailField ? '✅' : '❌');
        console.log('- Telefone:', phoneField ? '✅' : '❌');
        console.log('- Checkbox:', checkbox ? '✅' : '❌');
        console.log('- Submit:', submitButton ? '✅' : '❌');
        
        // Verificar se há erros no console
        const errorElements = modal.querySelectorAll('[class*="error"], [class*="destructive"]');
        console.log('Elementos de erro encontrados:', errorElements.length);
        
        return modal;
      }
    }
  });
  
  return null;
};

// Verificar se há erros JavaScript
const checkJavaScriptErrors = () => {
  console.log('🚨 Verificando erros JavaScript...');
  
  // Interceptar erros
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args);
    console.log('❌ ERRO CAPTURADO:', args);
    originalError.apply(console, args);
  };
  
  // Verificar se há erros relacionados ao AddClientModal
  const errorMessages = errors.map(error => error.join(' '));
  const modalErrors = errorMessages.filter(msg => 
    msg.includes('AddClientModal') || 
    msg.includes('booking_clients') || 
    msg.includes('user_id') ||
    msg.includes('constraint')
  );
  
  if (modalErrors.length > 0) {
    console.log('❌ Erros relacionados ao modal encontrados:', modalErrors);
  } else {
    console.log('✅ Nenhum erro relacionado ao modal encontrado');
  }
  
  return errors;
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

// Testar criação de cliente diretamente
const testDirectClientCreation = async (user) => {
  if (!user) return;
  
  console.log('🧪 Testando criação de cliente diretamente...');
  
  const testData = {
    name: 'Cliente Teste Modal Debug',
    email: `teste_modal_debug_${Date.now()}@exemplo.com`,
    phone: '11999999999',
    password_hash: 'temp_hash',
    user_id: user.id
  };
  
  try {
    const { data, error } = await supabase
      .from('booking_clients')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro na criação direta:', error);
      console.error('❌ Código:', error.code);
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Detalhes:', error.details);
    } else {
      console.log('✅ Cliente criado com sucesso:', data);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
};

// Executar todas as verificações
const runDebug = async () => {
  console.log('🚀 Iniciando debug completo do AddClientModal...');
  
  checkJavaScriptErrors();
  const addClientModal = checkAddClientModal();
  const user = await checkAuth();
  await testDirectClientCreation(user);
  
  console.log('✅ Debug completo finalizado');
  
  if (!addClientModal) {
    console.log('💡 Dica: Abra o modal de agendamento primeiro, depois execute este script novamente');
  }
};

// Executar quando chamado
runDebug();
