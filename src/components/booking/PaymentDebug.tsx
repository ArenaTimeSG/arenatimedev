import React from 'react';

const PaymentDebug: React.FC = () => {
  const checkEnvironment = () => {
    console.log('🔍 [DEBUG] Verificando ambiente...');
    console.log('🔍 [DEBUG] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔍 [DEBUG] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Presente' : 'Ausente');
    console.log('🔍 [DEBUG] SessionStorage keys:', Object.keys(sessionStorage));
    console.log('🔍 [DEBUG] Payment data:', sessionStorage.getItem('paymentData'));
    console.log('🔍 [DEBUG] Booking data:', sessionStorage.getItem('bookingData'));
    console.log('🔍 [DEBUG] Appointment data:', sessionStorage.getItem('appointmentData'));
  };

  React.useEffect(() => {
    checkEnvironment();
  }, []);

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-semibold text-yellow-800 mb-2">Debug do Sistema de Pagamento</h3>
      <button 
        onClick={checkEnvironment}
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
      >
        Verificar Ambiente
      </button>
      <div className="mt-2 text-sm text-yellow-700">
        <p>Verifique o console (F12) para logs detalhados</p>
      </div>
    </div>
  );
};

export default PaymentDebug;
