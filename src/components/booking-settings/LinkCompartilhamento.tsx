import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Copy, Check, ExternalLink, Share2, Eye, EyeOff } from 'lucide-react';

interface LinkCompartilhamentoProps {
  link: string;
  ativo: boolean;
}

const LinkCompartilhamento = ({ link, ativo }: LinkCompartilhamentoProps) => {
  const [copiado, setCopiado] = useState(false);
  const [mostrarLink, setMostrarLink] = useState(true);

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  const handleAbrirLink = () => {
    window.open(link, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Link className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Link de Compartilhamento</h3>
          <p className="text-sm text-gray-600">
            Link público para clientes acessarem o agendamento online
          </p>
        </div>
      </div>

      {/* Status do Link */}
      <div className={`p-4 rounded-xl border mb-6 ${
        ativo 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {ativo ? (
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            ) : (
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            )}
            <span className={`text-sm font-medium ${
              ativo ? 'text-green-800' : 'text-red-800'
            }`}>
              {ativo ? 'Link Ativo' : 'Link Inativo'}
            </span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            ativo 
              ? 'bg-green-200 text-green-800' 
              : 'bg-red-200 text-red-800'
          }`}>
            {ativo ? 'Disponível' : 'Indisponível'}
          </span>
        </div>
      </div>

      {/* Campo do Link */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Link Público
        </label>
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type={mostrarLink ? 'text' : 'password'}
                value={link}
                readOnly
                className={`w-full px-4 py-3 pr-12 border rounded-lg bg-gray-50 text-gray-700 ${
                  ativo ? 'border-green-300' : 'border-red-300'
                }`}
                placeholder="Link de agendamento..."
              />
              <button
                onClick={() => setMostrarLink(!mostrarLink)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarLink ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <motion.button
              onClick={handleCopiarLink}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                copiado
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {copiado ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </motion.button>
            
            <motion.button
              onClick={handleAbrirLink}
              disabled={!ativo}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                ativo
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={ativo ? { scale: 1.02 } : {}}
              whileTap={ativo ? { scale: 0.98 } : {}}
            >
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
        
        {copiado && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-green-600 mt-2 flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            Link copiado para a área de transferência!
          </motion.p>
        )}
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Como Compartilhar
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Compartilhe este link nas suas redes sociais</li>
          <li>• Envie por WhatsApp ou e-mail para seus clientes</li>
          <li>• Adicione o link no seu site ou perfil de negócio</li>
          <li>• Cole em cartões de visita ou materiais promocionais</li>
        </ul>
      </div>

      {/* Estatísticas do Link */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">1,247</div>
            <div className="text-xs text-gray-600">Visualizações</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">89</div>
            <div className="text-xs text-gray-600">Reservas via Link</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkCompartilhamento;
