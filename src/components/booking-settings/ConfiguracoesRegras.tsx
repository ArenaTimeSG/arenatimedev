import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Save, AlertCircle, Info } from 'lucide-react';

interface ConfiguracoesRegrasProps {
  tempoMinimo: number;
  duracaoPadrao: number;
  onUpdate: (tempoMinimo: number, duracaoPadrao: number) => void;
}

const ConfiguracoesRegras = ({ tempoMinimo, duracaoPadrao, onUpdate }: ConfiguracoesRegrasProps) => {
  const [formData, setFormData] = useState({
    tempoMinimo: tempoMinimo,
    duracaoPadrao: duracaoPadrao
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onUpdate(formData.tempoMinimo, formData.duracaoPadrao);
    setSalvando(false);
    setSalvo(true);
    
    setTimeout(() => setSalvo(false), 3000);
  };

  const hasChanges = formData.tempoMinimo !== tempoMinimo || formData.duracaoPadrao !== duracaoPadrao;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <Clock className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Regras de Agendamento</h3>
          <p className="text-sm text-gray-600">
            Configure as regras e restrições para o agendamento online
          </p>
        </div>
      </div>

      {/* Formulário de Configurações */}
      <div className="space-y-6">
        {/* Tempo Mínimo de Antecedência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tempo Mínimo de Antecedência
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="168"
              value={formData.tempoMinimo}
              onChange={(e) => handleInputChange('tempoMinimo', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="24"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              horas
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Clientes só podem agendar com pelo menos este tempo de antecedência
          </p>
        </div>

        {/* Duração Padrão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duração Padrão das Reservas
          </label>
          <div className="relative">
            <input
              type="number"
              min="15"
              max="240"
              step="15"
              value={formData.duracaoPadrao}
              onChange={(e) => handleInputChange('duracaoPadrao', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="60"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              minutos
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Duração padrão para todas as modalidades (pode ser alterada individualmente)
          </p>
        </div>
      </div>

      {/* Informações Importantes */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">Configurações Importantes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Tempo mínimo:</strong> Evita agendamentos de última hora</li>
              <li>• <strong>Duração padrão:</strong> Aplicada a todas as modalidades</li>
              <li>• As alterações afetam apenas novos agendamentos</li>
              <li>• Reservas existentes não são alteradas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Exemplos de Horários */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Exemplos de Horários Disponíveis
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-2">Com {formData.tempoMinimo}h de antecedência:</p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>• Hoje às 15:00 → Disponível a partir de amanhã às 15:00</p>
              <p>• Amanhã às 10:00 → Disponível a partir de hoje às 10:00</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 mb-2">Duração de {formData.duracaoPadrao}min:</p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>• Reserva às 14:00 → Termina às {Math.floor((14 * 60 + formData.duracaoPadrao) / 60)}:{(14 * 60 + formData.duracaoPadrao) % 60 === 0 ? '00' : (14 * 60 + formData.duracaoPadrao) % 60}</p>
              <p>• Próximo horário disponível: {Math.floor((14 * 60 + formData.duracaoPadrao) / 60)}:{(14 * 60 + formData.duracaoPadrao) % 60 === 0 ? '00' : (14 * 60 + formData.duracaoPadrao) % 60}</p>
            </div>
          </div>
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
                ? 'bg-purple-600 text-white hover:bg-purple-700'
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
                Salvar Configurações
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export { ConfiguracoesRegras };
