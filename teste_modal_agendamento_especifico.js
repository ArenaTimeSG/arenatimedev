// Script de teste específico para o modal de agendamento
// Execute este código no console do navegador quando estiver no dashboard

console.log('🔍 Teste específico do modal de agendamento...');

// Função para simular clique em uma célula do calendário
const simulateCellClick = () => {
  console.log('🖱️ Simulando clique em célula do calendário...');
  
  // Procurar por uma célula clicável no calendário
  const cells = document.querySelectorAll('[data-testid="calendar-cell"], .calendar-cell, .time-slot');
  console.log('Células encontradas:', cells.length);
  
  if (cells.length > 0) {
    const firstCell = cells[0];
    console.log('Clicando na primeira célula:', firstCell);
    firstCell.click();
    
    // Verificar se o modal abriu
    setTimeout(() => {
      const modal = document.querySelector('[role="dialog"]');
      console.log('Modal aberto após clique:', modal ? '✅' : '❌');
      
      if (modal) {
        // Verificar se o ClientSearchDropdown está presente
        const clientDropdown = modal.querySelector('input[placeholder*="buscar"]');
        console.log('ClientSearchDropdown encontrado:', clientDropdown ? '✅' : '❌');
        
        if (clientDropdown) {
          // Simular digitação no campo de busca
          clientDropdown.focus();
          clientDropdown.value = 'teste';
          clientDropdown.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Verificar se o botão "Adicionar Cliente" aparece
          setTimeout(() => {
            const addButton = modal.querySelector('button:contains("Adicionar Cliente")');
            console.log('Botão "Adicionar Cliente" encontrado:', addButton ? '✅' : '❌');
            
            if (addButton) {
              console.log('🖱️ Clicando no botão "Adicionar Cliente"...');
              addButton.click();
              
              // Verificar se o AddClientModal abriu
              setTimeout(() => {
                const addClientModal = document.querySelector('[role="dialog"]:last-child');
                console.log('AddClientModal aberto:', addClientModal ? '✅' : '❌');
                
                if (addClientModal) {
                  // Verificar se os campos estão presentes
                  const nameField = addClientModal.querySelector('input[type="text"]');
                  const emailField = addClientModal.querySelector('input[type="email"]');
                  const phoneField = addClientModal.querySelector('input[type="tel"]');
                  
                  console.log('Campo Nome:', nameField ? '✅' : '❌');
                  console.log('Campo Email:', emailField ? '✅' : '❌');
                  console.log('Campo Telefone:', phoneField ? '✅' : '❌');
                  
                  // Testar preenchimento e submissão
                  if (nameField && emailField) {
                    console.log('📝 Testando preenchimento do formulário...');
                    nameField.value = 'Cliente Teste Modal';
                    emailField.value = 'teste@modal.com';
                    
                    // Disparar eventos de input
                    nameField.dispatchEvent(new Event('input', { bubbles: true }));
                    emailField.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Procurar botão de submit
                    const submitButton = addClientModal.querySelector('button[type="submit"]');
                    console.log('Botão Submit encontrado:', submitButton ? '✅' : '❌');
                    
                    if (submitButton) {
                      console.log('🚀 Testando submissão do formulário...');
                      submitButton.click();
                    }
                  }
                }
              }, 1000);
            }
          }, 500);
        }
      }
    }, 500);
  } else {
    console.log('❌ Nenhuma célula clicável encontrada');
  }
};

// Executar teste
simulateCellClick();
