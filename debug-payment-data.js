// Debug script para verificar dados de pagamento
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xjsovawofsibcolnrgxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsc2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNzYzNjMsImV4cCI6MjA0Njk1MjM2M30.yR0Q7PzGOG2R7hM3Y8xGVQzKx3Q5P6dJwO8lY3MvNBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPaymentData() {
  console.log('🔍 Verificando dados de pagamento mais recentes...');
  
  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log('📊 Dados de pagamento encontrados:');
  payments.forEach((payment, index) => {
    console.log(`\n--- Pagamento ${index + 1} ---`);
    console.log('ID:', payment.id);
    console.log('Preference ID:', payment.mercado_pago_preference_id);
    console.log('Status:', payment.status);
    console.log('Appointment data:', JSON.stringify(payment.appointment_data, null, 2));
    console.log('Created at:', payment.created_at);
  });
}

debugPaymentData().catch(console.error);
