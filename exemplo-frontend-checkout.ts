// =====================================================
// EXEMPLO DE COMO USAR O CHECKOUT NO FRONTEND
// =====================================================

// 1. INTERFACE PARA OS DADOS DO PAGAMENTO
interface PaymentData {
  user_id: string;
  amount: number;
  description: string;
  client_name: string;
  client_email: string;
  booking_id: string; // ID do agendamento que será pago
}

// 2. FUNÇÃO PARA CRIAR PREFERÊNCIA DE PAGAMENTO
async function createPaymentPreference(paymentData: PaymentData) {
  try {
    console.log('🚀 Criando preferência de pagamento...', paymentData);
    
    const response = await fetch('/api/create-payment-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro ao criar preferência: ${error.error}`);
    }

    const result = await response.json();
    console.log('✅ Preferência criada:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao criar preferência:', error);
    throw error;
  }
}

// 3. FUNÇÃO PARA ABRIR CHECKOUT DO MERCADO PAGO
function openMercadoPagoCheckout(preferenceId: string) {
  // Certifique-se de ter o SDK do Mercado Pago carregado
  if (typeof window !== 'undefined' && (window as any).MercadoPago) {
    const mp = new (window as any).MercadoPago('YOUR_PUBLIC_KEY'); // Substitua pela sua chave pública
    
    const checkout = mp.checkout({
      preference: {
        id: preferenceId
      },
      render: {
        container: '.checkout-container', // Elemento onde o checkout será renderizado
        label: 'Pagar'
      }
    });
    
    console.log('💳 Checkout do Mercado Pago aberto');
  } else {
    console.error('❌ SDK do Mercado Pago não encontrado');
  }
}

// 4. FUNÇÃO COMPLETA PARA PROCESSAR PAGAMENTO
async function processPayment(appointmentData: {
  appointmentId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  description: string;
  adminUserId: string;
}) {
  try {
    console.log('🚀 Iniciando processo de pagamento...', appointmentData);
    
    // Criar preferência de pagamento
    const paymentData: PaymentData = {
      user_id: appointmentData.adminUserId,
      amount: appointmentData.amount,
      description: appointmentData.description,
      client_name: appointmentData.clientName,
      client_email: appointmentData.clientEmail,
      booking_id: appointmentData.appointmentId // 👈 ID do agendamento
    };
    
    const preference = await createPaymentPreference(paymentData);
    
    // Abrir checkout
    openMercadoPagoCheckout(preference.preference_id);
    
    console.log('✅ Processo de pagamento iniciado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro no processo de pagamento:', error);
    alert('Erro ao processar pagamento. Tente novamente.');
  }
}

// 5. EXEMPLO DE USO EM UM COMPONENTE REACT
function PaymentButton({ appointment }: { appointment: any }) {
  const handlePayment = async () => {
    try {
      await processPayment({
        appointmentId: appointment.id,
        clientName: appointment.client_name,
        clientEmail: appointment.client_email,
        amount: appointment.valor_total,
        description: `Agendamento ${appointment.modality}`,
        adminUserId: appointment.user_id
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  return (
    <button 
      onClick={handlePayment}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
      Agendar e Pagar
    </button>
  );
}

// 6. EXEMPLO DE USO EM HTML PURO
function setupPaymentButton() {
  const button = document.getElementById('payment-button');
  const appointmentData = {
    appointmentId: 'uuid-do-agendamento',
    clientName: 'João Silva',
    clientEmail: 'joao@email.com',
    amount: 50.00,
    description: 'Agendamento Personal Training',
    adminUserId: 'admin-user-id'
  };

  button?.addEventListener('click', async () => {
    try {
      await processPayment(appointmentData);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  });
}

// 7. CONFIGURAÇÃO DO SDK DO MERCADO PAGO (HTML)
/*
<!DOCTYPE html>
<html>
<head>
    <script src="https://sdk.mercadopago.com/js/v2"></script>
</head>
<body>
    <div class="checkout-container"></div>
    <button id="payment-button">Agendar e Pagar</button>
    
    <script>
        // Configurar SDK
        const mp = new MercadoPago('YOUR_PUBLIC_KEY');
        
        // Configurar botão
        setupPaymentButton();
    </script>
</body>
</html>
*/

// 8. EXEMPLO DE MONITORAMENTO DO STATUS
async function checkPaymentStatus(appointmentId: string) {
  try {
    const response = await fetch(`/api/appointments/${appointmentId}`);
    const appointment = await response.json();
    
    console.log('Status do agendamento:', appointment.status);
    console.log('Status do pagamento:', appointment.payment_status);
    
    if (appointment.status === 'pago') {
      console.log('✅ Pagamento confirmado!');
      // Atualizar UI para mostrar que está pago
    } else if (appointment.payment_status === 'pending') {
      console.log('⏳ Pagamento pendente...');
      // Mostrar status pendente
    } else if (appointment.payment_status === 'failed') {
      console.log('❌ Pagamento falhou');
      // Mostrar erro e permitir nova tentativa
    }
    
  } catch (error) {
    console.error('Erro ao verificar status:', error);
  }
}

export {
  createPaymentPreference,
  openMercadoPagoCheckout,
  processPayment,
  PaymentButton,
  checkPaymentStatus
};
