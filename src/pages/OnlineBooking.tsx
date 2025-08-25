import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, ArrowLeft, AlertCircle, X } from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAdminByUsername } from '@/hooks/useAdminByUsername';
import { useOnlineBooking } from '@/hooks/useOnlineBooking';
import { useAvailableHours } from '@/hooks/useAvailableHours';
import CardModalidade from '@/components/booking/CardModalidade';
import Calendario from '@/components/booking/Calendario';
import ListaHorarios from '@/components/booking/ListaHorarios';
import FormCliente from '@/components/booking/FormCliente';
import ResumoReserva from '@/components/booking/ResumoReserva';

interface Modalidade {
  id: string;
  name: string;
  duracao: number;
  valor: number;
  descricao: string;
  cor: string;
}

interface Cliente {
  nome: string;
  email: string;
  telefone: string;
}

interface Reserva {
  modalidade: Modalidade | null;
  data: Date | null;
  horario: string | null;
  cliente: Cliente;
}

const OnlineBooking = () => {
  const { username } = useParams<{ username: string }>();
  
  const [step, setStep] = useState(1);
  const [reserva, setReserva] = useState<Reserva>({
    modalidade: null,
    data: null,
    horario: null,
    cliente: { nome: '', email: '', telefone: '' }
  });
  const [reservaConfirmada, setReservaConfirmada] = useState(false);
  const [reservationStatus, setReservationStatus] = useState<'success' | 'pending' | null>(null);

  // Buscar dados do admin baseado no username
  const { 
    data: adminData, 
    isLoading: loadingAdmin, 
    error: adminError 
  } = useAdminByUsername(username || '');

  // Hook para salvar reserva
  const { 
    createReservation, 
    isCreating, 
    error: reservationError 
  } = useOnlineBooking();

  // Hook para horários disponíveis (movido para nível superior)
  const availableHours = useAvailableHours({
    workingHours: adminData?.settings?.working_hours || {
      monday: { enabled: true, start: '08:00', end: '18:00' },
      tuesday: { enabled: true, start: '08:00', end: '18:00' },
      wednesday: { enabled: true, start: '08:00', end: '18:00' },
      thursday: { enabled: true, start: '08:00', end: '18:00' },
      friday: { enabled: true, start: '08:00', end: '18:00' },
      saturday: { enabled: true, start: '08:00', end: '18:00' },
      sunday: { enabled: false, start: '08:00', end: '18:00' }
    },
    selectedDate: reserva.data || new Date(),
    tempoMinimoAntecedencia: adminData?.settings?.online_booking?.tempo_minimo_antecedencia || 24
  });

  // Função para gerar cor baseada no nome da modalidade
  const getModalidadeColor = useCallback((name: string): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500',
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  }, []);

  // Converter modalidades do admin para o formato esperado (memoizado)
  const modalidades = useMemo(() => {
    if (!adminData?.modalities) return [];
    
    return adminData.modalities.map(mod => ({
      id: mod.id,
      name: mod.name,
      duracao: 60, // Duração padrão de 60 minutos
      valor: parseFloat(mod.valor.toString()),
      descricao: `${mod.name} - 60 minutos`,
      cor: getModalidadeColor(mod.name)
    }));
  }, [adminData?.modalities, getModalidadeColor]);

  const handleModalidadeSelect = useCallback((modalidade: Modalidade) => {
    setReserva(prev => ({ ...prev, modalidade }));
    setStep(2);
  }, []);

  const handleDataSelect = useCallback((data: Date) => {
    setReserva(prev => ({ ...prev, data }));
    setStep(3);
  }, []);

  const handleHorarioSelect = useCallback((horario: string) => {
    setReserva(prev => ({ ...prev, horario }));
    setStep(4);
  }, []);

  const handleClienteSubmit = useCallback((cliente: Cliente) => {
    setReserva(prev => ({ ...prev, cliente }));
    setStep(5);
  }, []);

  const handleConfirmarReserva = useCallback(async () => {
    if (!adminData || !reserva.modalidade || !reserva.data || !reserva.horario) {
      return;
    }

    try {
      const autoConfirmada = adminData?.settings?.online_booking?.auto_agendar || false;
      
      await createReservation({
        admin_user_id: adminData.user.user_id,
        modalidade_id: reserva.modalidade.id,
        modalidade_name: reserva.modalidade.name, // Adicionar nome da modalidade
        data: reserva.data.toISOString(),
        horario: reserva.horario,
        cliente_nome: reserva.cliente.nome,
        cliente_email: reserva.cliente.email,
        cliente_telefone: reserva.cliente.telefone,
        valor: reserva.modalidade.valor,
        auto_confirmada: autoConfirmada
      });

      setReservationStatus(autoConfirmada ? 'success' : 'pending');
      setReservaConfirmada(true);
      
      // Reset após 5 segundos
      setTimeout(() => {
        setReservaConfirmada(false);
        setReservationStatus(null);
        setReserva({
          modalidade: null,
          data: null,
          horario: null,
          cliente: { nome: '', email: '', telefone: '' }
        });
        setStep(1);
      }, 5000);
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
    }
  }, [adminData, reserva, createReservation]);

  const handleVoltar = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  // Loading state
  if (loadingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 font-medium">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  // Error state - Admin não encontrado
  if (adminError || !adminData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda não encontrada</h1>
          <p className="text-slate-600">O link de agendamento não está disponível ou foi removido.</p>
        </div>
      </div>
    );
  }

  // Se o agendamento online está desativado
  if (!adminData?.settings?.online_booking?.ativo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Agendamento Online Desativado</h1>
          <p className="text-slate-600">O agendamento online está temporariamente indisponível.</p>
        </div>
      </div>
    );
  }

  // Se não há modalidades cadastradas
  if (modalidades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nenhuma modalidade disponível</h1>
          <p className="text-slate-600">Não há modalidades cadastradas para agendamento no momento.</p>
        </div>
      </div>
    );
  }

  // Success state - Reserva confirmada
  if (reservaConfirmada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            {reservationStatus === 'success' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Clock className="w-8 h-8 text-yellow-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {reservationStatus === 'success' ? 'Reserva Confirmada!' : 'Reserva Pendente'}
          </h1>
          <p className="text-slate-600">
            {reservationStatus === 'success' 
              ? 'Sua reserva foi confirmada automaticamente.' 
              : 'Sua reserva foi enviada e aguarda confirmação.'
            }
          </p>
        </div>
      </div>
    );
  }

  // Tela principal de agendamento
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step > 1 && (
                <button
                  onClick={handleVoltar}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {adminData?.user?.name} - Agendamento
                </h1>
                <p className="text-slate-600 text-sm">Reserve seu horário de forma rápida e fácil</p>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="hidden md:flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber <= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 5 && (
                    <div className={`w-8 h-1 mx-1 ${
                      stepNumber < step ? 'bg-blue-600' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Seleção da Modalidade */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Escolha sua Modalidade</h2>
                <p className="text-gray-600">Selecione o esporte que você deseja praticar</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modalidades.map((modalidade) => (
                  <CardModalidade
                    key={modalidade.id}
                    modalidade={modalidade}
                    onSelect={handleModalidadeSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Calendário */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Escolha a Data</h2>
                <p className="text-gray-600">
                  Selecione a data para sua reserva de {reserva.modalidade?.name}
                </p>
              </div>
              
              <Calendario
                onDataSelect={handleDataSelect}
                modalidade={reserva.modalidade!}
                workingHours={adminData?.settings?.working_hours}
                tempoMinimoAntecedencia={adminData?.settings?.online_booking?.tempo_minimo_antecedencia || 24}
              />
            </div>
          )}

          {/* Step 3: Horários */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Escolha o Horário</h2>
                <p className="text-gray-600">
                  {reserva.modalidade?.name} - {reserva.data && format(reserva.data, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              
              <ListaHorarios
                horarios={availableHours}
                onHorarioSelect={handleHorarioSelect}
                modalidade={reserva.modalidade!}
                data={reserva.data!}
              />
            </div>
          )}

          {/* Step 4: Dados do Cliente */}
          {step === 4 && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Seus Dados</h2>
                <p className="text-gray-600">Preencha suas informações para confirmar a reserva</p>
              </div>
              
              <FormCliente
                onSubmit={handleClienteSubmit}
                reserva={reserva}
              />
            </div>
          )}

          {/* Step 5: Resumo e Confirmação */}
          {step === 5 && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Confirme sua Reserva</h2>
                <p className="text-gray-600">Revise os dados antes de confirmar</p>
              </div>
              
              <ResumoReserva
                reserva={reserva}
                onConfirmar={handleConfirmarReserva}
                isCreating={isCreating}
                autoConfirmada={adminData?.settings?.online_booking?.auto_agendar || false}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OnlineBooking;
