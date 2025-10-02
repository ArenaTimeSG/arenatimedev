// Teste para verificar se create-payment-preference está salvando client_data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xjsovawofsibcolnrgxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsc2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNzYzNjMsImV4cCI6MjA0Njk1MjM2M30.yR0Q7PzGOG2R7hM3Y8xGVQzKx3Q5P6dJwO8lY3MvNBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreatePaymentPreference() {
  console.log('🔍 Testing create-payment-preference with client_data...');
  
  const testData = {
    owner_id: 'e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f',
    price: 50,
    items: [{ title: 'Test Appointment', quantity: 1, unit_price: 50 }],
    client_data: {
      name: 'PEDRO TESTE',
      email: 'pedro.teste@debug.com',
      phone: '11999999999'
    },
    appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    modality_id: '26e1913e-ede1-4365-b9d8-19870d2fa4c0'
  };
  
  console.log('📤 Sending data to create-payment-preference:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      console.error('❌ Error response:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error details:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Response:', JSON.stringify(result, null, 2));
    
    if (result.preference_id) {
      // Verificar se client_data foi salvo no banco
      console.log('🔍 Checking if client_data was saved in database...');
      
      const { data: paymentRecord, error } = await supabase
        .from('payments')
        .select('appointment_data, mercado_pago_preference_id')
        .eq('mercado_pago_preference_id', result.preference_id)
        .single();
        
      if (error) {
        console.error('❌ Database error:', error);
      } else {
        console.log('📊 Payment record:', JSON.stringify(paymentRecord, null, 2));
        
        if (paymentRecord.appointment_data?.client_data) {
          console.log('✅ client_data SAVED successfully!');
          console.log('Client data:', JSON.stringify(paymentRecord.appointment_data.client_data, null, 2));
        } else {
          console.log('❌ client_data NOT SAVED!');
          console.log('Full appointment_data:', JSON.stringify(paymentRecord.appointment_data, null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testCreatePaymentPreference().catch(console.error);
