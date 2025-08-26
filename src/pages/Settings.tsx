import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import ResponsiveTabs from '@/components/ui/responsive-tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSettings } from '@/hooks/useSettings';
import { useClientBookings } from '@/hooks/useClientBookings';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, Bell, User, Shield, Settings as SettingsIcon, Palette, Save, AlertCircle, Calendar, Globe } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { ToggleAgendamento } from '@/components/booking-settings/ToggleAgendamento';
import { LinkCompartilhamento } from '@/components/booking-settings/LinkCompartilhamento';
import { ConfiguracoesRegras } from '@/components/booking-settings/ConfiguracoesRegras';
import { AutoAgendar } from '@/components/booking-settings/AutoAgendar';
import { ListaReservas } from '@/components/booking-settings/ListaReservas';

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, isLoading: settingsLoading, error, updateSettings } = useSettings();
  const { 
    agendamentos, 
    isLoading: bookingsLoading, 
    confirmBooking, 
    cancelBooking, 
    markCompleted 
  } = useClientBookings(user?.id);

  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState('profile');
  
  // Estado para controlar o modal de alteração de senha
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Função para trocar de aba com verificação de mudanças não salvas
  const handleTabChange = (newTab: string) => {
    if (activeTab === 'profile' && hasProfileChanges) {
      const confirmed = window.confirm(
        'Você tem alterações não salvas no perfil. Deseja sair mesmo assim?'
      );
      if (!confirmed) {
        return;
      }
    }
    setActiveTab(newTab);
  };

  // Estados para diferentes configurações
  const [workingHours, setWorkingHours] = useState({
    monday: { enabled: true, start: '08:00', end: '18:00' },
    tuesday: { enabled: true, start: '08:00', end: '18:00' },
    wednesday: { enabled: true, start: '08:00', end: '18:00' },
    thursday: { enabled: true, start: '08:00', end: '18:00' },
    friday: { enabled: true, start: '08:00', end: '18:00' },
    saturday: { enabled: true, start: '08:00', end: '18:00' },
    sunday: { enabled: false, start: '08:00', end: '18:00' }
  });

  const [defaultInterval, setDefaultInterval] = useState(60);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    alerts: {
      booking: true,
      cancellation: true,
      payment: true
    }
  } as {
    email: boolean;
    push: boolean;
    alerts: {
      booking: boolean;
      cancellation: boolean;
      payment: boolean;
    };
  });
  
  // Estado local para dados pessoais (não salva automaticamente)
  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    phone: ''
  } as { name: string; email: string; phone: string });
  
  // Estado para controlar se houve mudanças no perfil
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estados para Agendamento Online
  const [configuracaoAgendamento, setConfiguracaoAgendamento] = useState({
    ativo: settings?.online_enabled ?? false,
    autoAgendar: settings?.online_booking?.auto_agendar ?? false,
    tempoMinimoAntecedencia: settings?.online_booking?.tempo_minimo_antecedencia ?? 24,
    duracaoPadrao: 60,
    linkPublico: profile?.username 
      ? `${window.location.origin}/agendar/${profile.username}`
      : `${window.location.origin}/agendar`
  });



  // Carregar configurações quando disponíveis
  useEffect(() => {
    if (settings) {
      if (settings.working_hours) {
        const loadedHours = {
          monday: settings.working_hours.monday || { enabled: true, start: '08:00', end: '18:00' },
          tuesday: settings.working_hours.tuesday || { enabled: true, start: '08:00', end: '18:00' },
          wednesday: settings.working_hours.wednesday || { enabled: true, start: '08:00', end: '18:00' },
          thursday: settings.working_hours.thursday || { enabled: true, start: '08:00', end: '18:00' },
          friday: settings.working_hours.friday || { enabled: true, start: '08:00', end: '18:00' },
          saturday: settings.working_hours.saturday || { enabled: true, start: '08:00', end: '18:00' },
          sunday: settings.working_hours.sunday || { enabled: false, start: '08:00', end: '18:00' }
        };
        setWorkingHours(loadedHours);
      }

      if (settings.default_interval) {
        setDefaultInterval(settings.default_interval);
      }

      if (settings.notifications_enabled) {
        setNotifications({
          email: settings.notifications_enabled.email ?? true,
          push: settings.notifications_enabled.push ?? false,
          alerts: {
            booking: settings.notifications_enabled.alerts?.booking ?? true,
            cancellation: settings.notifications_enabled.alerts?.cancellation ?? true,
            payment: settings.notifications_enabled.alerts?.payment ?? true
          }
        });
      }

      if (settings.personal_data) {
        setPersonalData({
          name: settings.personal_data.name || '',
          email: settings.personal_data.email || '',
          phone: settings.personal_data.phone || ''
        });
        setHasProfileChanges(false); // Reset das mudanças ao carregar
      }
    }
  }, [settings]);

  // Atualizar link do agendamento online quando o perfil carregar
  useEffect(() => {
    if (profile?.name) {
      setConfiguracaoAgendamento(prev => ({
        ...prev,
        linkPublico: `https://arenatime.com/booking/${profile.name.toLowerCase().replace(/\s+/g, '-')}`
      }));
    }
  }, [profile?.name]);

  // Função para atualizar horário
  const handleWorkingHourChange = async (day: string, field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    const updatedHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day as keyof typeof workingHours],
        [field]: value
      }
    };

    // Validação de horários
    if (field === 'start' || field === 'end') {
      const daySchedule = updatedHours[day as keyof typeof updatedHours];
      if (daySchedule.enabled) {
        const startMinutes = parseInt(daySchedule.start.split(':')[0]) * 60 + parseInt(daySchedule.start.split(':')[1]);
        const endMinutes = parseInt(daySchedule.end.split(':')[0]) * 60 + parseInt(daySchedule.end.split(':')[1]);
        const adjustedEndMinutes = endMinutes === 0 ? 24 * 60 : endMinutes;
        
        if (startMinutes >= adjustedEndMinutes) {
          toast({
            title: 'Horário inválido',
            description: 'Horário de início deve ser menor que o horário de fim.',
            variant: 'destructive',
          });
          return;
        }
      }
    }

    setWorkingHours(updatedHours);

    try {
      await updateSettings({ working_hours: updatedHours });
      // Garantir que permaneça na aba de horários
      setActiveTab('schedule');
      toast({
        title: 'Salvo',
        description: 'Horário atualizado com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração.',
        variant: 'destructive',
      });
    }
  };

  // Função para atualizar intervalo padrão
  const handleIntervalChange = async (value: string) => {
    const interval = parseInt(value);
    setDefaultInterval(interval);

    try {
      await updateSettings({ default_interval: interval });
      // Garantir que permaneça na aba de agendamentos
      setActiveTab('appointments');
      toast({
        title: 'Salvo',
        description: 'Intervalo padrão atualizado.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao salvar intervalo:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o intervalo.',
        variant: 'destructive',
      });
    }
  };

  // Função para atualizar notificações
  const handleNotificationChange = async (type: string, value: boolean | any) => {
    let updatedNotifications;
    
    if (type === 'alerts') {
      updatedNotifications = {
        ...notifications,
        alerts: {
          ...notifications.alerts,
          ...value
        }
      };
    } else {
      updatedNotifications = {
        ...notifications,
        [type]: value
      };
    }
    
    setNotifications(updatedNotifications);

    try {
      await updateSettings({ notifications_enabled: updatedNotifications });
      // Garantir que permaneça na aba de notificações
      setActiveTab('notifications');
      toast({
        title: 'Salvo',
        description: 'Configuração de notificação atualizada.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao salvar notificações:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração.',
        variant: 'destructive',
      });
    }
  };

  // Função para atualizar dados pessoais (apenas no estado local)
  const handlePersonalDataChange = (field: string, value: string) => {
    const updatedData = {
      ...personalData,
      [field]: value
    };
    setPersonalData(updatedData);
    setHasProfileChanges(true); // Marcar que houve mudanças
  };

  // Função para salvar dados pessoais
  const handleSavePersonalData = async () => {
    setIsSavingProfile(true);
    
    try {
      await updateSettings({ personal_data: personalData });
      setHasProfileChanges(false); // Reset das mudanças após salvar
      toast({
        title: 'Perfil atualizado!',
        description: 'Seus dados pessoais foram salvos com sucesso.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao salvar dados pessoais:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Funções para Agendamento Online
  const handleToggleAgendamento = async (ativo: boolean) => {
    setConfiguracaoAgendamento(prev => ({ ...prev, ativo }));
    
    // Salvar no banco de dados
    if (settings) {
      await updateSettings({
        ...settings,
        online_enabled: ativo
      });
    }
  };

  const handleToggleAutoAgendar = (autoAgendar: boolean) => {
    setConfiguracaoAgendamento(prev => ({ ...prev, autoAgendar }));
  };

  const handleUpdateRegras = (tempoMinimo: number, duracaoPadrao: number) => {
    setConfiguracaoAgendamento(prev => ({ 
      ...prev, 
      tempoMinimoAntecedencia: tempoMinimo,
      duracaoPadrao: duracaoPadrao
    }));
  };

  const handleCancelarReserva = (id: string) => {
    cancelBooking(id);
    toast({
      title: 'Reserva cancelada',
      description: 'A reserva foi cancelada com sucesso.',
    });
  };

  const handleConfirmarReserva = (id: string) => {
    confirmBooking(id);
    toast({
      title: 'Reserva confirmada',
      description: 'A reserva foi confirmada com sucesso.',
    });
  };

  const handleMarcarRealizada = (id: string) => {
    markCompleted(id);
    toast({
      title: 'Reserva marcada como realizada',
      description: 'A reserva foi marcada como realizada.',
    });
  };

  // Loading states
  if (authLoading || settingsLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 font-medium">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  // Usuário não autenticado
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-lg font-medium text-slate-800">Erro ao carregar configurações</div>
          <div className="text-sm text-slate-600">
            {error.message || 'Ocorreu um erro inesperado'}
          </div>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <motion.header 
        className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                  <SettingsIcon className="h-6 w-6" />
                  Configurações
                </h1>
                <p className="text-slate-600 text-sm font-medium">Gerencie suas preferências</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Conteúdo das Configurações */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <ResponsiveTabs
              items={[
                { value: "profile", label: "Perfil", icon: <User className="h-4 w-4" /> },
                { value: "schedule", label: "Horários", icon: <Clock className="h-4 w-4" /> },
                { value: "modalities", label: "Modalidades", icon: <Calendar className="h-4 w-4" /> },
                { value: "appointments", label: "Agendamentos", icon: <SettingsIcon className="h-4 w-4" /> },
                { value: "online-booking", label: "Agendamento Online", icon: <Globe className="h-4 w-4" /> },
                { value: "notifications", label: "Notificações", icon: <Bell className="h-4 w-4" /> },
                { value: "security", label: "Segurança", icon: <Shield className="h-4 w-4" /> }
              ]}
              value={activeTab}
              onValueChange={handleTabChange}
            />

            {/* Aba Perfil */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-800">Informações Pessoais</CardTitle>
                    {hasProfileChanges && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-lg border border-orange-200">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-orange-700 font-medium">Alterações não salvas</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700 font-medium">Nome Completo</Label>
                      <Input 
                        id="name" 
                        value={personalData.name}
                        onChange={(e) => handlePersonalDataChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        className="border-slate-200 focus:border-blue-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={personalData.email}
                        onChange={(e) => handlePersonalDataChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        className="border-slate-200 focus:border-blue-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700 font-medium">Telefone</Label>
                      <Input 
                        id="phone" 
                        value={personalData.phone}
                        onChange={(e) => handlePersonalDataChange('phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="border-slate-200 focus:border-blue-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-slate-700 font-medium">Função</Label>
                      <Input 
                        id="role" 
                        value="Administrador"
                        disabled
                        className="bg-slate-50 text-slate-500 border-slate-200"
                        placeholder="Sua função no sistema" 
                      />
                    </div>
                  </div>
                  
                  {/* Botão de Salvar */}
                  <div className="flex justify-end pt-6 border-t border-slate-200">
                    <Button
                      onClick={handleSavePersonalData}
                      disabled={!hasProfileChanges || isSavingProfile}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isSavingProfile ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Horários */}
            <TabsContent value="schedule" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
                  <CardTitle className="text-xl font-bold text-slate-800">Horários de Funcionamento</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <p className="text-sm text-slate-600">
                      Configure os horários em que você aceita agendamentos. As alterações são salvas automaticamente.
                    </p>
                    
                    {days.map((day) => (
                      <div key={day.key} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium text-slate-700">{day.label}</Label>
                          <Switch
                            checked={workingHours[day.key as keyof typeof workingHours].enabled}
                            onCheckedChange={(checked) => 
                              handleWorkingHourChange(day.key, 'enabled', checked)
                            }
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </div>
                        
                        {workingHours[day.key as keyof typeof workingHours].enabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-700">Início</Label>
                              <Input
                                type="time"
                                value={workingHours[day.key as keyof typeof workingHours].start}
                                onChange={(e) => 
                                  handleWorkingHourChange(day.key, 'start', e.target.value)
                                }
                                className="border-slate-200 focus:border-blue-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-700">Fim</Label>
                              <Input
                                type="time"
                                value={workingHours[day.key as keyof typeof workingHours].end}
                                onChange={(e) => 
                                  handleWorkingHourChange(day.key, 'end', e.target.value)
                                }
                                className="border-slate-200 focus:border-blue-300"
                              />
                            </div>
                          </div>
                        )}
                        
                        {day.key !== 'sunday' && <Separator className="bg-slate-200" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Agendamentos */}
            <TabsContent value="appointments" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
                  <CardTitle className="text-xl font-bold text-slate-800">Configurações de Agendamentos</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Intervalo Padrão (minutos)</Label>
                    <Select value={defaultInterval.toString()} onValueChange={handleIntervalChange}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-600">
                      Intervalo padrão para novos agendamentos
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Agendamento Online */}
            <TabsContent value="online-booking" className="space-y-6">
              <div className="grid gap-6">
                <ToggleAgendamento 
                  ativo={configuracaoAgendamento.ativo}
                  onToggle={handleToggleAgendamento}
                />
                
                <LinkCompartilhamento />
                
                <AutoAgendar 
                  ativo={configuracaoAgendamento.autoAgendar}
                  onToggle={handleToggleAutoAgendar}
                />
                
                <ConfiguracoesRegras 
                  tempoMinimo={configuracaoAgendamento.tempoMinimoAntecedencia}
                  duracaoPadrao={configuracaoAgendamento.duracaoPadrao}
                  onUpdate={handleUpdateRegras}
                />
                
                <ListaReservas 
                  reservas={agendamentos.map(agendamento => ({
                    id: agendamento.id,
                    cliente: {
                      nome: 'Cliente Online',
                      email: 'cliente@online.com',
                      telefone: 'N/A'
                    },
                    modalidade: agendamento.modality,
                    data: new Date(agendamento.date),
                    horario: new Date(agendamento.date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }),
                    status: agendamento.status === 'a_cobrar' ? 'pendente' : 
                           agendamento.status === 'agendado' ? 'confirmada' : 
                           agendamento.status === 'pago' ? 'realizada' : 'cancelada',
                    valor: agendamento.valor_total || 0
                  }))}
                  onCancelar={handleCancelarReserva}
                  onConfirmar={handleConfirmarReserva}
                  onMarcarRealizada={handleMarcarRealizada}
                />
              </div>
            </TabsContent>

            {/* Aba Notificações */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
                  <CardTitle className="text-xl font-bold text-slate-800">Configurações de Notificações</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium text-slate-700">Notificações por Email</Label>
                      <p className="text-sm text-slate-600">
                        Receba lembretes de agendamentos por email
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </div>
                  
                  <Separator className="bg-slate-200" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium text-slate-700">Notificações Push</Label>
                      <p className="text-sm text-slate-600">
                        Receba notificações no navegador
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push}
                      onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </div>

                  <Separator className="bg-slate-200" />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium text-slate-700">Alertas de Agendamentos</Label>
                      <p className="text-sm text-slate-600">
                        Receber alertas sobre novos agendamentos
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.alerts?.booking || false}
                      onCheckedChange={(checked) => {
                        const updatedAlerts = {
                          ...notifications.alerts,
                          booking: checked
                        };
                        handleNotificationChange('alerts', updatedAlerts);
                      }}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Modalidades */}
            <TabsContent value="modalities" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
                  <CardTitle className="text-xl font-bold text-slate-800">Gerenciar Modalidades</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Modalidades Esportivas
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Cadastre e gerencie suas modalidades esportivas com valores personalizados
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate('/modalities')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Gerenciar Modalidades
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Segurança */}
            <TabsContent value="security" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
                  <CardTitle className="text-xl font-bold text-slate-800">Configurações de Segurança</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-slate-700">Alterar Senha</Label>
                    <p className="text-sm text-slate-600">
                      Mantenha sua conta segura com uma senha forte
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setIsChangePasswordModalOpen(true)}
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </div>
                  
                  <Separator className="bg-slate-200" />
                  
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-slate-700">Sessões Ativas</Label>
                    <p className="text-sm text-slate-600">
                      Gerencie suas sessões ativas
                    </p>
                    <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
                      Esta sessão
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Modal de Alteração de Senha */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default Settings;

