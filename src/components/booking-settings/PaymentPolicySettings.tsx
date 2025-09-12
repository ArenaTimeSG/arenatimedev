import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Save, AlertCircle, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_POLICY_OPTIONS } from '@/types/settings';
import { ComingSoonCard } from './ComingSoonCard';

interface PaymentPolicySettingsProps {
  paymentPolicy: 'sem_pagamento' | 'obrigatorio' | 'opcional';
  onUpdate: (paymentPolicy: 'sem_pagamento' | 'obrigatorio' | 'opcional') => void;
}

const PaymentPolicySettings = ({ paymentPolicy, onUpdate }: PaymentPolicySettingsProps) => {
  // Usar localStorage como fallback se o campo não existir no banco
  const [selectedPolicy, setSelectedPolicy] = useState(() => {
    const stored = localStorage.getItem('payment_policy');
    return stored || paymentPolicy;
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const handlePolicyChange = (value: string) => {
    setSelectedPolicy(value as 'sem_pagamento' | 'obrigatorio' | 'opcional');
  };

  const handleSalvar = async () => {
    setSalvando(true);
    
    try {
      console.log('💾 Salvando política de pagamento:', selectedPolicy);
      
      // Salvar no localStorage como fallback
      localStorage.setItem('payment_policy', selectedPolicy);
      
      // Tentar salvar no banco
      try {
        await onUpdate(selectedPolicy);
      } catch (error) {
        console.warn('⚠️ Erro ao salvar no banco, usando localStorage:', error);
        // Se der erro no banco, pelo menos salvamos no localStorage
      }
      
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch (error) {
      console.error('❌ Erro ao salvar política de pagamento:', error);
    } finally {
      setSalvando(false);
    }
  };

  const hasChanges = selectedPolicy !== paymentPolicy;

  const getPolicyDescription = (policy: string) => {
    switch (policy) {
      case 'sem_pagamento':
        return 'Clientes podem agendar sem necessidade de pagamento';
      case 'obrigatorio':
        return 'Clientes devem pagar antecipadamente para confirmar o agendamento';
      case 'opcional':
        return 'Clientes podem escolher se querem pagar ou não ao agendar';
      default:
        return '';
    }
  };

  return (
    <ComingSoonCard
      title="Política de Pagamento"
      description="Configure se clientes devem pagar antecipadamente, opcionalmente ou sem pagamento para agendamentos online"
      icon={<CreditCard className="w-6 h-6 text-green-600" />}
    />
  );
};

export { PaymentPolicySettings };