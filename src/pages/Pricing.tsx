import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRICES } from '@/config/prices';
import supabase from '@/lib/supabase';

const plans = [
  { key: 'MENSAL', title: 'Mensal', price: 'R$ 49,90/mês', description: 'Ideal para começar' },
  { key: 'TRIMESTRAL', title: 'Trimestral', price: 'R$ 129,90/trim.', description: 'Economize no trimestre' },
  { key: 'ANUAL', title: 'Anual', price: 'R$ 449,90/ano', description: 'Melhor custo-benefício' },
] as const;

export default function Pricing() {
  const navigate = useNavigate();

  useEffect(() => {
    // garantir que tenha sessão; se não, envia para login
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/auth');
    });
  }, [navigate]);

  const handleSubscribe = async (priceEnvKey: keyof typeof PRICES) => {
    console.log('[Pricing] Click em Assinar para:', priceEnvKey);
    const priceId = PRICES[priceEnvKey];
    console.log('[Pricing] PRICE ID:', priceId);
    if (!priceId) {
      alert('Configurar PRICE_ID no .env para ' + priceEnvKey);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    console.log('[Pricing] USER ID:', userId);
    if (!userId) {
      navigate('/auth');
      return;
    }

    console.log('[Pricing] Chamando Edge Function create-checkout-session...');
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, userId },
    });
    console.log('[Pricing] Resposta da função:', { data, error });
    if (error) {
      console.error('Erro ao iniciar checkout:', error);
      alert(error.message || 'Erro ao iniciar checkout');
      return;
    }
    if (data?.url) {
      console.log('[Pricing] Redirecionando para Stripe URL:', data.url);
      window.location.href = data.url;
    } else if (data?.error) {
      console.error('[Pricing] Erro retornado pela função:', data.error);
      alert(data.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800">Planos ArenaTime</h1>
          <p className="text-slate-600 mt-2">Assine para usar a plataforma</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.key} className="rounded-2xl bg-white shadow-lg p-6 border border-slate-200 flex flex-col">
              <h3 className="text-xl font-bold text-slate-800">{p.title}</h3>
              <div className="text-3xl font-extrabold text-blue-600 mt-2">{p.price}</div>
              <p className="text-sm text-slate-600 mt-1 mb-6">{p.description}</p>
              <button
                onClick={() => handleSubscribe(p.key)}
                className="mt-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold shadow"
              >
                Assinar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


