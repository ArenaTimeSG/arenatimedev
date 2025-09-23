import { motion } from 'framer-motion';
import { CreditCard, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const plans = [
  { id: 'mensal', title: 'Mensal', price: 'R$ 49,90/mês', description: 'Plano mensal para gestores', env: 'VITE_STRIPE_LINK_MENSAL' },
  { id: 'trimestral', title: 'Trimestral', price: 'R$ 129,90/trim.', description: 'Economize assinando por 3 meses', env: 'VITE_STRIPE_LINK_TRIMESTRAL' },
  { id: 'anual', title: 'Anual', price: 'R$ 449,90/ano', description: 'Melhor custo-benefício anual', env: 'VITE_STRIPE_LINK_ANUAL' },
] as const;

export const StripeSubscriptionSettings = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Assinatura da Plataforma</CardTitle>
              <p className="text-sm text-slate-600">Cobrança para gestores (Stripe) — visual, em breve</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const paymentLink = (import.meta as any).env?.[plan.env];
              const configured = Boolean(paymentLink);
              return (
              <div key={plan.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-800">{plan.title}</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{plan.price}</p>
                  <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                </div>
                <div className="mt-auto">
                  {configured ? (
                    <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="w-full inline-block">
                      <Button className="w-full">
                        Assinar {plan.title}
                      </Button>
                    </a>
                  ) : (
                    <Button disabled className="w-full cursor-not-allowed opacity-70">
                      <Lock className="h-4 w-4 mr-2" /> Configurar link Stripe
                    </Button>
                  )}
                </div>
              </div>
            );})}
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700">
            Esta assinatura é destinada aos gestores que utilizam o ArenaTime. Os clientes não são cobrados aqui. Para ativar os botões, configure as variáveis de ambiente: <code>VITE_STRIPE_LINK_MENSAL</code>, <code>VITE_STRIPE_LINK_TRIMESTRAL</code> e <code>VITE_STRIPE_LINK_ANUAL</code> com os Payment Links do Stripe.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StripeSubscriptionSettings;


