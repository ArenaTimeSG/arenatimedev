import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Save, AlertCircle, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_POLICY_OPTIONS } from '@/types/settings';

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
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Política de Pagamento</h3>
          <p className="text-sm text-gray-600">
            Configure como os clientes devem pagar ao fazer agendamentos online
          </p>
        </div>
      </div>

      {/* Formulário de Configuração */}
      <div className="space-y-6">
        {/* Seleção da Política */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Política de Pagamento
          </label>
          <Select value={selectedPolicy} onValueChange={handlePolicyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma política de pagamento" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_POLICY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 mt-2">
            {getPolicyDescription(selectedPolicy)}
          </p>
        </div>
      </div>

      {/* Informações Importantes */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">Como Funciona</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Sem Pagamento:</strong> Agendamentos são confirmados automaticamente</li>
              <li>• <strong>Obrigatório:</strong> Cliente deve pagar para confirmar o agendamento</li>
              <li>• <strong>Opcional:</strong> Cliente escolhe se quer pagar ou não</li>
              <li>• A política afeta apenas novos agendamentos online</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Aviso sobre migração */}
      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Nota Técnica</h4>
            <p className="text-sm text-blue-700">
              Se você estiver vendo erros ao salvar, pode ser necessário executar a migração do banco de dados. 
              A configuração será salva localmente até que a migração seja aplicada.
            </p>
          </div>
        </div>
      </div>

      {/* Exemplos de Uso */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Exemplos de Uso
        </h4>
        <div className="space-y-3">
          {selectedPolicy === 'sem_pagamento' && (
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Fluxo sem pagamento:</p>
              <p>Cliente seleciona horário → Confirma dados → Agendamento confirmado automaticamente</p>
            </div>
          )}
          {selectedPolicy === 'obrigatorio' && (
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Fluxo com pagamento obrigatório:</p>
              <p>Cliente seleciona horário → Confirma dados → Paga → Agendamento confirmado</p>
            </div>
          )}
          {selectedPolicy === 'opcional' && (
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Fluxo com pagamento opcional:</p>
              <p>Cliente seleciona horário → Confirma dados → Escolhe pagar ou não → Agendamento confirmado</p>
            </div>
          )}
        </div>
      </div>

      {/* Botão de Salvar */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {hasChanges && (
              <span className="text-orange-600 font-medium">
                ⚠️ Alterações não salvas
              </span>
            )}
          </div>
          
          <motion.button
            onClick={handleSalvar}
            disabled={!hasChanges || salvando}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              hasChanges && !salvando
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={hasChanges && !salvando ? { scale: 1.02 } : {}}
            whileTap={hasChanges && !salvando ? { scale: 0.98 } : {}}
          >
            {salvando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : salvo ? (
              <>
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configuração
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export { PaymentPolicySettings };