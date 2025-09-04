import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useWorkingHours } from '@/hooks/useWorkingHours';
import { useSettingsSync } from '@/hooks/useSettingsSync';
import { useToast } from '@/hooks/use-toast';
import { useAppointments } from '@/hooks/useAppointments';
import { formatCurrency } from '@/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Plus, Users, DollarSign, Activity, LogOut, FileText, Settings, ChevronLeft, ChevronRight, User, ChevronDown, Shield, Mail, Phone, Clock, TrendingUp, CheckCircle, AlertCircle, AlertTriangle, Repeat } from 'lucide-react';

import { format, startOfWeek, addDays, isSameDay, isBefore, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NewAppointmentModal from '@/components/NewAppointmentModal';
import AppointmentDetailsModal from '@/components/AppointmentDetailsModal';
import BlockTimeModal from '@/components/BlockTimeModal';
import UnblockConfirmModal from '@/components/UnblockConfirmModal';
import { StatCard } from '@/components/animated/StatCard';
import { AppointmentCard } from '@/components/animated/AppointmentCard';
import ResponsiveCalendar from '@/components/ResponsiveCalendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Appointment {
  id: string;
  date: string;
  status: 'a_cobrar' | 'pago' | 'cancelado' | 'agendado';
  modality: string | null;
  modality_id: string | null;
  valor_total: number;
  client: {
    name: string;
  };
  client_id?: string;
  booking_source?: 'manual' | 'online';
  modality_info?: {
    name: string;
    valor: number;
  };
  recurrence_id?: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const { appointments, getFinancialSummary, isLoading: appointmentsLoading } = useAppointments();
  
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [blockedTimeSlot, setBlockedTimeSlot] = useState<{day: Date, timeSlot: string} | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
  const [isRecurringForUnblock, setIsRecurringForUnblock] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    phone?: string;
  } | null>(null);

  // Hook para gerenciar horários de funcionamento
  const {
    generateTimeSlots,
    isTimeSlotBlocked,
    isTimeSlotAvailable,
    getCellBackgroundColor,
    canCreateAppointment,
    getAvailableHoursForDay,
    isDayEnabled,
    blockTimeSlot,
    unblockTimeSlot,
    getBlockadeReason,
    isRecurringBlockade,
    isRecurringBlockadeFromDB,
    getBlockadeInfo
  } = useWorkingHours();

  // Hook para sincronizar configurações
  useSettingsSync();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && !loading) {
      fetchUserProfile();
    }
  }, [user, loading]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name, email, phone')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        setUserProfile({
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          phone: user.user_metadata?.phone || ''
        });
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setUserProfile({
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        phone: user.user_metadata?.phone || ''
      });
    }
  };


  // Função para filtrar agendamentos da semana atual
  const getAppointmentsForCurrentWeek = () => {
    // Usar a mesma lógica do ResponsiveCalendar para garantir consistência
    const weekStart = startOfWeek(currentWeek, { locale: ptBR });
    const weekEnd = addDays(weekStart, 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const filteredAppointments = appointments.filter(apt => {
      const appointmentDate = new Date(apt.date);
      
      // Normalizar a data do agendamento para comparar apenas a data (sem hora)
      const aptDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
      
      // Verificar se o agendamento está dentro da semana
      const isInWeek = aptDateOnly >= weekStart && aptDateOnly <= weekEnd;
      
      return isInWeek;
    });
    

    
    return filteredAppointments;
  };

  const getStatusColor = (status: string, date?: string, recurrence_id?: string) => {
    let effectiveStatus = status;
    if (date && status === 'agendado') {
      const appointmentDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      appointmentDate.setHours(0, 0, 0, 0);
      
      if (isBefore(appointmentDate, today)) {
        effectiveStatus = 'a_cobrar';
      }
    }
    
    if (recurrence_id) {
      switch (effectiveStatus) {
        case 'pago': return 'bg-green-100 text-green-800 border-green-200';
        case 'a_cobrar': return 'bg-red-100 text-red-800 border-red-200';
        case 'agendado': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'cancelado': return 'bg-gray-100 text-gray-600 border-gray-200 line-through';
        default: return 'bg-blue-50 text-blue-700 border-blue-200';
      }
    } else {
      switch (effectiveStatus) {
        case 'pago': return 'bg-green-100 text-green-800 border-green-200';
        case 'a_cobrar': return 'bg-red-100 text-red-800 border-red-200';
        case 'agendado': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'cancelado': return 'bg-gray-100 text-gray-600 border-gray-200 line-through';
        default: return 'bg-purple-50 text-purple-700 border-purple-200';
      }
    }
  };

  const getStatusLabel = (status: string, date?: string) => {
    if (date) {
      const appointmentDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      appointmentDate.setHours(0, 0, 0, 0);
      
      if (isBefore(appointmentDate, today) && status === 'agendado') {
        return 'A Cobrar';
      }
    }
    
    if (status === 'cancelado') return 'Cancelado';
    if (status === 'pago') return 'Pago';
    if (status === 'agendado') return 'Agendado';
    if (status === 'a_cobrar') return 'A Cobrar';
    
    return 'A Cobrar';
  };

  const timeSlots = generateTimeSlots();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const weekStart = startOfWeek(currentWeek, { locale: ptBR });
    return addDays(weekStart, i);
  });

  const getAppointmentForSlot = (day: Date, timeSlot: string) => {
    const slotHour = parseInt(timeSlot.split(':')[0]);
    
    const appointment = appointments.find(apt => {
      const aptDate = new Date(apt.date);
      const aptHour = aptDate.getHours();
      return isSameDay(aptDate, day) && aptHour === slotHour;
    });

    return appointment;
  };

  const handleCellClick = (day: Date, timeSlot: string, event?: React.MouseEvent) => {
    const appointment = getAppointmentForSlot(day, timeSlot);
    
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsDetailsModalOpen(true);
    } else {
      // Verificar se o horário está bloqueado
      const isBlocked = isTimeSlotBlocked(day, timeSlot);
      
      if (isBlocked) {
        // Se está bloqueado, mostrar confirmação
        setBlockedTimeSlot({ day, timeSlot });
        setIsConfirmationModalOpen(true);
      } else {
        // Se Ctrl está pressionado, abrir modal de bloqueio
        if (event && event.ctrlKey) {
          setSelectedDate(day);
          setSelectedTime(timeSlot);
          setIsBlockModalOpen(true);
        } else {
          // Se não está bloqueado, abrir modal de agendamento
          setSelectedDate(day);
          setSelectedTime(timeSlot);
          setIsModalOpen(true);
        }
      }
    }
  };

  const handleAppointmentCreated = () => {
    // Os agendamentos são atualizados automaticamente pelo hook useAppointments
  };

  const handleAppointmentUpdated = () => {
    // Os agendamentos são atualizados automaticamente pelo hook useAppointments
  };

  // Calcular valores financeiros para a semana atual
  const getFinancialSummaryForCurrentWeek = () => {
    const weekAppointments = getAppointmentsForCurrentWeek();
    return getFinancialSummary(weekAppointments);
  };

  const handleProfileClick = () => {
    navigate('/settings');
  };

  const handleConfirmBlockedTimeSlot = () => {
    if (blockedTimeSlot) {
      setSelectedDate(blockedTimeSlot.day);
      setSelectedTime(blockedTimeSlot.timeSlot);
      setIsConfirmationModalOpen(false);
      setBlockedTimeSlot(null);
      setIsModalOpen(true);
    }
  };

  const handleCancelBlockedTimeSlot = () => {
    setIsConfirmationModalOpen(false);
    setBlockedTimeSlot(null);
  };

  const handleBlocked = (blockData: {
    reason: string;
    description?: string;
    isRecurring: boolean;
    endDate?: Date;
    isIndefinite?: boolean;
    recurrenceType?: 'daily' | 'weekly' | 'monthly';
  }) => {
    if (selectedDate && selectedTime) {
      blockTimeSlot(selectedDate, selectedTime, blockData.reason, {
        description: blockData.description,
        isRecurring: blockData.isRecurring,
        endDate: blockData.endDate,
        isIndefinite: blockData.isIndefinite,
        recurrenceType: blockData.recurrenceType
      });
    }
  };

  const handleOpenBlockModal = () => {
    setIsModalOpen(false);
    setIsBlockModalOpen(true);
  };

  const handleUnblockTimeSlot = (removeAllFollowing: boolean) => {
    if (selectedDate && selectedTime) {
      unblockTimeSlot(selectedDate, selectedTime, removeAllFollowing);
      toast({ 
        title: "Sucesso", 
        description: removeAllFollowing 
          ? "Todos os bloqueios seguintes foram removidos!" 
          : "Horário desbloqueado com sucesso!" 
      });
    }
  };

  const handleOpenUnblockModal = async () => {
    if (selectedDate && selectedTime) {
      // Verificar se é recorrente baseado no banco de dados
      const isRecurring = await isRecurringBlockadeFromDB(selectedDate, selectedTime);
      console.log('🔍 Modal de desbloqueio - é recorrente?', isRecurring);
      setIsRecurringForUnblock(isRecurring);
      setIsUnblockModalOpen(true);
    }
  };

  const generateAvailableHoursPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Horários Disponíveis da Semana', 105, 20, { align: 'center' });
    
    let currentY = 35;
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const weekStart = startOfWeek(currentWeek, { locale: ptBR });
      return addDays(weekStart, i);
    });
    
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    weekDays.forEach((day, dayIndex) => {
      const dayName = dayNames[dayIndex];
      const dayDate = format(day, 'dd/MM', { locale: ptBR });
      
      const isEnabled = isDayEnabled(day);
      
      doc.setFontSize(12);
      doc.text(`${dayName} (${dayDate})`, 20, currentY);
      currentY += 8;
      
      if (!isEnabled) {
        doc.setFontSize(10);
        doc.text('FECHADO', 25, currentY);
        currentY += 12;
      } else {
        const availableHours = getAvailableHoursForDay(day);
        
        const dayAppointments = appointments.filter(apt => 
          isSameDay(new Date(apt.date), day)
        );
        
        const occupiedHours = dayAppointments.map(apt => 
          format(new Date(apt.date), 'HH:00')
        );
        
        const freeHours = availableHours.filter(time => 
          !occupiedHours.includes(time)
        );
        
        if (freeHours.length > 0) {
          const columns = 5;
          const rows = Math.ceil(freeHours.length / columns);
          
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              const index = row * columns + col;
              if (index < freeHours.length) {
                const hour = freeHours[index];
                const x = 25 + col * 35;
                const y = currentY + row * 5;
                doc.setFontSize(9);
                doc.text(hour, x, y);
              }
            }
          }
          currentY += rows * 5 + 3;
        } else {
          doc.setFontSize(10);
          doc.text('Nenhum horário disponível', 25, currentY);
          currentY += 8;
        }
      }
      
      currentY += 3;
    });
    
    const fileName = `horarios_semana_${format(currentWeek, 'yyyy_MM_dd', { locale: ptBR })}.pdf`;
    doc.save(fileName);
    
    toast({
      title: 'PDF gerado!',
      description: 'Relatório de horários da semana foi baixado.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Sidebar */}
      <motion.aside 
        className="fixed left-0 top-0 h-full w-20 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-xl z-40"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center py-6 space-y-6 h-full">
          {/* Logo */}
          <motion.div 
            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-white font-bold text-lg">AT</span>
          </motion.div>

          {/* Navigation */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            {/* Dashboard - Active */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all duration-300 shadow-sm"
                title="Dashboard"
              >
                <Calendar className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Appointments */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/appointments')}
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-300 shadow-sm"
                title="Agendamentos"
              >
                <Clock className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* New Appointment */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/appointments/new')}
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-300 shadow-sm"
                title="Novo Agendamento"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Clients */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/clients')}
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-300 shadow-sm"
                title="Clientes"
              >
                <Users className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Financial */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/financial')}
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-300 shadow-sm"
                title="Financeiro"
              >
                <DollarSign className="h-5 w-5" />
              </Button>
            </motion.div>


            {/* Settings */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-300 shadow-sm"
                title="Configurações"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          {/* User Profile */}
          <div className="w-full px-2">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-12 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 rounded-xl transition-all duration-300 shadow-sm"
                    title={userProfile?.name || 'Usuário'}
                  >
                    <Avatar className="h-6 w-6 border-2 border-blue-200">
                      <AvatarImage src="" alt={userProfile?.name || 'Usuário'} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                        {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" alt={userProfile?.name || 'Usuário'} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                            {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-semibold leading-none">{userProfile?.name || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground mt-1">{userProfile?.email}</p>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <div className="px-3 py-2 bg-slate-50 rounded-lg mx-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{userProfile?.email}</span>
                    </div>
                    {userProfile?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Phone className="h-4 w-4" />
                        <span>{userProfile.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleProfileClick} className="py-3">
                    <User className="mr-3 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 py-3"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="ml-20">
        {/* Modern Header */}
        <motion.header 
          className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 shadow-sm"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ArenaTime
                </h1>
                <p className="text-slate-600 text-sm font-medium">Dashboard de Gestão</p>
              </div>
              
              <div className="flex items-center gap-4">
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAvailableHoursPDF}
                    className="bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Horários Disponíveis
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Enhanced Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <StatCard
              title="Agendamentos Hoje"
              value={appointments.filter(apt => {
                const aptDate = new Date(apt.date);
                const today = new Date();
                return isSameDay(aptDate, today);
              }).length}
              icon={Calendar}
              color="blue"
              description="Horários do dia"
              delay={0}
            />
            
            <StatCard
              title="A Cobrar"
              value={formatCurrency(getFinancialSummaryForCurrentWeek().total_pendente)}
              icon={AlertCircle}
              color="red"
              description="Pendentes de pagamento"
              delay={0.1}
            />
            
            <StatCard
              title="Pagos"
              value={formatCurrency(getFinancialSummaryForCurrentWeek().total_recebido)}
              icon={CheckCircle}
              color="green"
              description="Recebidos este período"
              delay={0.2}
            />
            
            <StatCard
              title="Esta Semana"
              value={getAppointmentsForCurrentWeek().length}
              icon={TrendingUp}
              color="orange"
              description="Total de agendamentos"
              delay={0.3}
            />
          </motion.div>



          {/* Responsive Calendar */}
          <motion.div
            key={currentWeek.toISOString()}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
                       {appointmentsLoading ? (
             <div className="flex items-center justify-center p-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
               <span className="ml-3 text-slate-600">Carregando agenda...</span>
             </div>
           ) : (
                           <ResponsiveCalendar
                currentWeek={currentWeek}
                setCurrentWeek={setCurrentWeek}
                appointments={getAppointmentsForCurrentWeek()}
                timeSlots={timeSlots}
                onCellClick={handleCellClick}
                getAppointmentForSlot={getAppointmentForSlot}
                isTimeSlotBlocked={isTimeSlotBlocked}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                getBlockadeReason={getBlockadeReason}
              />
           )}
          </motion.div>
        </div>
      </div>

      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onAppointmentCreated={handleAppointmentCreated}
        onBlockTime={handleOpenBlockModal}
      />

      <BlockTimeModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onBlocked={handleBlocked}
      />

      <UnblockConfirmModal
        isOpen={isUnblockModalOpen}
        onClose={() => setIsUnblockModalOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        isRecurring={isRecurringForUnblock}
        onConfirm={handleUnblockTimeSlot}
      />

      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onAppointmentUpdated={handleAppointmentUpdated}
      />

      {/* Enhanced Confirmation Modal */}
      {isConfirmationModalOpen && blockedTimeSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Confirmar Agendamento</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
              Você está tentando agendar um horário que normalmente não está disponível:
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Data:</span>
                  <span>{format(blockedTimeSlot.day, 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Horário:</span>
                  <span>{blockedTimeSlot.timeSlot}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Dia:</span>
                  <span>{format(blockedTimeSlot.day, 'EEEE', { locale: ptBR })}</span>
                </div>
                {getBlockadeReason && getBlockadeReason(blockedTimeSlot.day, blockedTimeSlot.timeSlot) && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Motivo do bloqueio:</span>
                    <span className="text-yellow-700">{getBlockadeReason(blockedTimeSlot.day, blockedTimeSlot.timeSlot)}</span>
                  </div>
                )}
                {isRecurringBlockade && isRecurringBlockade(blockedTimeSlot.day, blockedTimeSlot.timeSlot) && (
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-700">Bloqueio Recorrente</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-slate-600 mb-6">
              Deseja continuar mesmo assim?
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCancelBlockedTimeSlot}
                className="border-slate-200 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDate(blockedTimeSlot.day);
                  setSelectedTime(blockedTimeSlot.timeSlot);
                  setIsConfirmationModalOpen(false);
                  setBlockedTimeSlot(null);
                  handleOpenUnblockModal();
                }}
                className="border-orange-200 hover:bg-orange-50 text-orange-700"
              >
                Desbloquear
              </Button>
              <Button
                onClick={handleConfirmBlockedTimeSlot}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Confirmar Agendamento
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
