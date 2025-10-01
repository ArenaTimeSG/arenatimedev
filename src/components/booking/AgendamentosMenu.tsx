import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface Agendamento {
  id: string;
  date: string;
  modality: string;
  status: string;
  valor_total: number;
  created_at: string;
}

interface AgendamentosMenuProps {
  clientId: string;
  adminUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

const AgendamentosMenu = ({ clientId, adminUserId, isOpen, onClose }: AgendamentosMenuProps) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'futuros' | 'passados'>('futuros');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Buscar agendamentos do cliente
  const fetchAgendamentos = async () => {
    if (!clientId || !adminUserId) {
      console.log('❌ clientId ou adminUserId não fornecidos:', { clientId, adminUserId });
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Buscando agendamentos para:', { clientId, adminUserId });
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', adminUserId)
        .order('date', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        console.error('❌ Detalhes do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      console.log('✅ Agendamentos encontrados:', data);
      setAgendamentos(data || []);
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cancelar agendamento
  const handleCancelar = async (agendamentoId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    setCancelingId(agendamentoId);
    try {
      console.log('🔍 Tentando cancelar agendamento:', agendamentoId);
      
      // Primeiro, verificar se o agendamento existe e pertence ao cliente
      const { data: agendamento, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', agendamentoId)
        .eq('client_id', clientId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar agendamento:', fetchError);
        alert('Erro ao verificar agendamento. Tente novamente.');
        return;
      }

      if (!agendamento) {
        console.error('❌ Agendamento não encontrado ou não pertence ao cliente');
        alert('Agendamento não encontrado.');
        return;
      }

      console.log('🔍 Agendamento encontrado:', agendamento);

      // Tentar cancelar o agendamento
      const { data: updateData, error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', agendamentoId)
        .eq('client_id', clientId)
        .select();

      if (updateError) {
        console.error('❌ Erro ao cancelar agendamento:', updateError);
        console.error('❌ Detalhes do erro:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        alert(`Erro ao cancelar agendamento: ${updateError.message}`);
        return;
      }

      console.log('✅ Agendamento cancelado com sucesso:', updateData);

      // Atualizar lista local
      setAgendamentos(prev => 
        prev.map(apt => 
          apt.id === agendamentoId 
            ? { ...apt, status: 'cancelado' }
            : apt
        )
      );

      alert('Agendamento cancelado com sucesso!');
    } catch (error) {
      console.error('❌ Erro inesperado ao cancelar agendamento:', error);
      alert('Erro inesperado ao cancelar agendamento. Tente novamente.');
    } finally {
      setCancelingId(null);
    }
  };

  // Buscar agendamentos quando o menu abrir
  useEffect(() => {
    if (isOpen) {
      fetchAgendamentos();
    }
  }, [isOpen, clientId, adminUserId]);

  // Inscrição Realtime para atualizações de agendamentos
  useEffect(() => {
    if (!clientId || !adminUserId || !isOpen) return;

    console.log('🔔 Configurando Supabase Realtime para:', { clientId, adminUserId });

    const channel = supabase
      .channel(`appointments-realtime-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('🔔 Mudança recebida em tempo real:', payload);

          if (payload.eventType === 'INSERT') {
            const newAppointment = payload.new as Agendamento;
            
            // Verificar se é para este adminUserId
            if (newAppointment.user_id !== adminUserId) return;

            console.log('✅ Novo agendamento recebido:', newAppointment);
            
            setAgendamentos(prev => {
              // Evitar duplicatas
              if (prev.some(apt => apt.id === newAppointment.id)) {
                return prev;
              }
              return [...prev, newAppointment];
            });

            // Mostrar mensagem de sucesso
            if (newAppointment.status === 'confirmed' || newAppointment.payment_status === 'approved') {
              setShowSuccessToast(true);
              setTimeout(() => setShowSuccessToast(false), 5000);
            }
          }

          if (payload.eventType === 'UPDATE') {
            const updatedAppointment = payload.new as Agendamento;
            
            // Verificar se é para este adminUserId
            if (updatedAppointment.user_id !== adminUserId) return;

            console.log('✅ Agendamento atualizado:', updatedAppointment);
            
            setAgendamentos(prev =>
              prev.map(apt =>
                apt.id === updatedAppointment.id ? updatedAppointment : apt
              )
            );

            // Mostrar mensagem de sucesso se o pagamento foi aprovado
            if (updatedAppointment.payment_status === 'approved' && updatedAppointment.status === 'confirmed') {
              setShowSuccessToast(true);
              setTimeout(() => setShowSuccessToast(false), 5000);
            }
          }

          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            console.log('❌ Agendamento deletado:', deletedId);
            
            setAgendamentos(prev =>
              prev.filter(apt => apt.id !== deletedId)
            );
          }
        }
      )
      .subscribe();

    // Cleanup ao desmontar
    return () => {
      console.log('🔕 Desconectando Supabase Realtime');
      supabase.removeChannel(channel);
    };
  }, [clientId, adminUserId, isOpen]);

  // Filtrar agendamentos por status e data
  const agendamentosFuturos = agendamentos.filter(apt => {
    const aptDate = parseISO(apt.date);
    const now = new Date();
    return isAfter(aptDate, now) && apt.status !== 'cancelado';
  });

  const agendamentosPassados = agendamentos.filter(apt => {
    const aptDate = parseISO(apt.date);
    const now = new Date();
    return isBefore(aptDate, now) || apt.status === 'cancelado';
  });

  const getStatusColor = (status: string, paymentStatus?: string) => {
    // Se o agendamento tem payment_status 'pending', mostrar como aguardando pagamento
    if (paymentStatus === 'pending') {
      return 'text-yellow-600 bg-yellow-100';
    }
    
    // Se o agendamento tem payment_status 'failed', mostrar como pagamento falhou
    if (paymentStatus === 'failed') {
      return 'text-red-600 bg-red-100';
    }
    
    // Status normal baseado no status principal
    switch (status) {
      case 'agendado':
      case 'pago':
        return 'text-green-600 bg-green-100';
      case 'a_cobrar':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelado':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string, paymentStatus?: string) => {
    // Se o agendamento tem payment_status 'pending', mostrar como aguardando pagamento
    if (paymentStatus === 'pending') {
      return 'Aguardando Pagamento';
    }
    
    // Se o agendamento tem payment_status 'failed', mostrar como pagamento falhou
    if (paymentStatus === 'failed') {
      return 'Pagamento Falhou';
    }
    
    // Status normal baseado no status principal
    switch (status) {
      case 'agendado':
      case 'pago':
        return 'Agendado';
      case 'a_cobrar':
        return 'Pendente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'agendado':
      case 'pago':
        return <CheckCircle className="w-4 h-4" />;
      case 'a_cobrar':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelado':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Toast de Sucesso */}
      {showSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-[60] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Pagamento Confirmado!</p>
            <p className="text-sm">Seu horário foi agendado com sucesso.</p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              <h2 className="text-xl font-bold">Meus Agendamentos</h2>
            </div>
                         <button
               onClick={onClose}
               className="px-3 py-1 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
             >
               Fechar
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('futuros')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'futuros'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Futuros ({agendamentosFuturos.length})
            </button>
            <button
              onClick={() => setActiveTab('passados')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'passados'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Passados ({agendamentosPassados.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando agendamentos...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'futuros' ? (
                agendamentosFuturos.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum agendamento futuro encontrado.</p>
                  </div>
                ) : (
                  agendamentosFuturos.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{agendamento.modality}</h3>
                            <p className="text-sm text-gray-600">
                              {format(parseISO(agendamento.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <p className="text-sm text-gray-600">
                              R$ {agendamento.valor_total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(agendamento.status, agendamento.payment_status)}`}>
                            {getStatusIcon(agendamento.status)}
                            {getStatusText(agendamento.status, agendamento.payment_status)}
                          </span>
                                                     {agendamento.status !== 'cancelado' && (
                             <button
                               onClick={() => handleCancelar(agendamento.id)}
                               disabled={cancelingId === agendamento.id}
                               className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium border border-red-200 hover:border-red-300"
                               title="Cancelar agendamento"
                             >
                               {cancelingId === agendamento.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                               ) : (
                                 'Cancelar'
                               )}
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                agendamentosPassados.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum agendamento passado encontrado.</p>
                  </div>
                ) : (
                  agendamentosPassados.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 opacity-75"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{agendamento.modality}</h3>
                            <p className="text-sm text-gray-600">
                              {format(parseISO(agendamento.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <p className="text-sm text-gray-600">
                              R$ {agendamento.valor_total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(agendamento.status, agendamento.payment_status)}`}>
                            {getStatusIcon(agendamento.status)}
                            {getStatusText(agendamento.status, agendamento.payment_status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AgendamentosMenu;
