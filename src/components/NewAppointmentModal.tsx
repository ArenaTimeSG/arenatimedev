import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format, isBefore, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useWorkingHours } from '@/hooks/useWorkingHours';
import { useModalities } from '@/hooks/useModalities';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  name: string;
}

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: string;
  onAppointmentCreated: () => void;
}

const NewAppointmentModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  selectedTime, 
  onAppointmentCreated 
}: NewAppointmentModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { getAvailableHoursForDay, isDayEnabled } = useWorkingHours();
  const { modalities = [] } = useModalities();
  const { createAppointment } = useAppointments();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    modality_id: '',
    date: '',
    time: '',
    isRecurring: false,
    recurrenceType: 'data_final' as 'data_final' | 'repeticoes' | 'indeterminado',
    endDate: '',
    repetitions: 1
  });

  // useEffect separado para carregar clientes quando modal abrir
  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  // useEffect separado para atualizar formData quando dados mudarem
  useEffect(() => {
    if (isOpen && selectedDate && selectedTime) {
      // Debug: verificar dados recebidos
      console.log('🔍 NewAppointmentModal - Dados recebidos:', {
        selectedDate: selectedDate?.toISOString(),
        selectedTime,
        isOpen
      });
      
      // Atualizar formData com os dados selecionados
      const newFormData = {
        client_id: '',
        modality_id: '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime, // Sempre definir o horário selecionado
        isRecurring: false,
        recurrenceType: 'data_final' as 'data_final' | 'repeticoes' | 'indeterminado',
        endDate: '',
        repetitions: 1
      };
      
      console.log('🔍 NewAppointmentModal - FormData atualizado:', newFormData);
      setFormData(newFormData);
    }
  }, [isOpen, selectedDate, selectedTime]);

  // useEffect separado para resetar quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      // Resetar formData quando o modal fechar
      setFormData({
        client_id: '',
        modality_id: '',
        date: '',
        time: '',
        isRecurring: false,
        recurrenceType: 'data_final',
        endDate: '',
        repetitions: 1
      });
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar clientes',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Gerar horários disponíveis baseados na data selecionada
  const getAvailableTimeSlots = (date: string) => {
    if (!date) return [];
    
    const selectedDate = new Date(date);
    const availableHours = getAvailableHoursForDay(selectedDate);
    
    // Garantir que o horário selecionado esteja sempre disponível
    if (selectedTime && !availableHours.includes(selectedTime)) {
      availableHours.push(selectedTime);
      availableHours.sort(); // Ordenar para manter consistência
    }
    
    console.log('🔍 NewAppointmentModal - getAvailableTimeSlots:', {
      date,
      selectedTime,
      availableHours,
      includesSelectedTime: availableHours.includes(selectedTime || '')
    });
    
    return availableHours;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.date || !formData.time || !formData.modality_id) {
      toast({
        title: 'Erro no agendamento',
        description: 'Todos os campos obrigatórios devem ser preenchidos',
        variant: 'destructive',
      });
      return;
    }

    if (formData.isRecurring) {
      if (formData.recurrenceType === 'data_final' && !formData.endDate) {
        toast({
          title: 'Erro no agendamento',
          description: 'Data final é obrigatória para recorrência',
          variant: 'destructive',
        });
        return;
      }
      if (formData.recurrenceType === 'repeticoes' && formData.repetitions < 1) {
        toast({
          title: 'Erro no agendamento',
          description: 'Número de repetições deve ser maior que zero',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const appointmentDate = new Date(`${formData.date}T${formData.time}:00`);
      
      // Comentado: Validação de data passada removida para permitir agendamentos retroativos
      // if (isBefore(appointmentDate, new Date()) && !isEqual(appointmentDate, new Date())) {
      //   toast({
      //     title: 'Erro no agendamento',
      //     description: 'Não é possível agendar para datas passadas',
      //     variant: 'destructive',
      //   });
      //   return;
      // }

      // Verificar se o dia está habilitado
      if (!isDayEnabled(appointmentDate)) {
        toast({
          title: 'Erro no agendamento',
          description: 'Este dia não está disponível para agendamento',
          variant: 'destructive',
        });
        return;
      }

      // Verificar se o horário está disponível
      const availableSlots = getAvailableTimeSlots(formData.date);
      if (!availableSlots.includes(formData.time)) {
        toast({
          title: 'Erro no agendamento',
          description: 'Este horário não está disponível para agendamento',
          variant: 'destructive',
        });
        return;
      }

      // Verificar conflitos de agendamento
      if (formData.isRecurring) {
        // Para agendamentos recorrentes, verificar todas as datas
        // Gerar um ID temporário para verificação de conflitos
        const tempRecurrenceId = `temp_${Date.now()}`;
        const recurringAppointments = generateRecurringAppointments(formData, appointmentDate, tempRecurrenceId);
        const datesToCheck = recurringAppointments.map(a => a.date);
        
        const { data: existingAppointments, error: checkError } = await supabase
          .from('appointments')
          .select('id, date')
          .in('date', datesToCheck);

        if (checkError) throw checkError;

        if (existingAppointments && existingAppointments.length > 0) {
          const conflictingDates = existingAppointments.map(a => new Date(a.date).toLocaleDateString('pt-BR'));
          toast({
            title: 'Conflito de agendamentos',
            description: `Já existem agendamentos nas seguintes datas: ${conflictingDates.join(', ')}`,
            variant: 'destructive',
          });
          return;
        }
      } else {
        // Para agendamento único, verificar apenas a data específica
        const { data: existingAppointment, error: checkError } = await supabase
          .from('appointments')
          .select('id')
          .eq('date', appointmentDate.toISOString())
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingAppointment) {
          toast({
            title: 'Erro no agendamento',
            description: 'Já existe um agendamento neste horário',
            variant: 'destructive',
          });
          return;
        }
      }

      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Criar agendamentos (recorrente ou único)
      if (formData.isRecurring) {
        // Primeiro, criar o registro de recorrência
        const { data: recurrenceData, error: recurrenceError } = await supabase
          .from('recurrences')
          .insert({
            type: formData.recurrenceType,
            end_date: formData.endDate || null,
            repetitions: formData.repetitions || null,
            user_id: user.id
          })
          .select()
          .single();

        if (recurrenceError) throw recurrenceError;

        console.log('🔍 NewAppointmentModal - Recorrência criada:', recurrenceData);

        // Criar agendamentos recorrentes com o recurrence_id correto
        const appointments = generateRecurringAppointments(formData, appointmentDate, recurrenceData.id, user.id);
        
        console.log('🔍 NewAppointmentModal - Criando agendamentos recorrentes:', {
          total: appointments.length,
          recurrenceId: recurrenceData.id,
          appointments: appointments.map(a => ({ date: a.date, time: a.time }))
        });

        // Inserir todos os agendamentos
        const { data: insertedAppointments, error: insertError } = await supabase
          .from('appointments')
          .insert(appointments)
          .select('*');

        if (insertError) throw insertError;

        toast({
          title: 'Agendamentos recorrentes criados!',
          description: `${appointments.length} agendamentos foram criados com sucesso.`,
        });

        // Otimização: Atualizar cache diretamente para agendamentos recorrentes
        if (insertedAppointments) {
          const queryClient = useQueryClient();
          queryClient.setQueryData(['appointments', user.id], (oldData: any[] | undefined) => {
            if (!oldData) return insertedAppointments;
            return [...insertedAppointments, ...oldData];
          });
          
          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ 
            queryKey: ['appointments'], 
            exact: false 
          });
        }
      } else {
        // Criar agendamento único usando o novo hook
        await createAppointment({
          client_id: formData.client_id,
          modality_id: formData.modality_id,
          date: appointmentDate.toISOString(),
          status: 'agendado'
        });
      }

      onAppointmentCreated();
      onClose();
      
      // Reset form
      setFormData({
        client_id: '',
        modality_id: '',
        date: '',
        time: '',
        isRecurring: false,
        recurrenceType: 'data_final',
        endDate: '',
        repetitions: 1
      });

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: 'Erro ao criar agendamento',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gerar agendamentos recorrentes
  const generateRecurringAppointments = (formData: any, startDate: Date, recurrenceId: string, userId: string) => {
    const appointments = [];
    let currentDate = new Date(startDate);
    let count = 0;
    
    console.log('🔍 NewAppointmentModal - Gerando agendamentos recorrentes:', {
      startDate: startDate.toISOString(),
      recurrenceType: formData.recurrenceType,
      endDate: formData.endDate,
      repetitions: formData.repetitions,
      recurrenceId,
      userId
    });

    while (true) {
      // Verificar se deve parar baseado no tipo de recorrência
      if (formData.recurrenceType === 'data_final') {
        if (formData.endDate && currentDate > new Date(formData.endDate)) {
          break;
        }
      } else if (formData.recurrenceType === 'repeticoes') {
        if (count >= formData.repetitions) {
          break;
        }
      } else if (formData.recurrenceType === 'indeterminado') {
        // Para recorrência indeterminada, criar por 52 semanas (1 ano)
        if (count >= 52) {
          break;
        }
      }

      // Verificar se o dia está habilitado
      const dayOfWeek = currentDate.getDay();
      const isEnabled = isDayEnabled(currentDate);
      
      // Debug específico para sábado
      if (dayOfWeek === 6) { // Sábado
        console.log('🔍 NewAppointmentModal - Verificando sábado:', {
          date: currentDate.toISOString(),
          dayOfWeek,
          isEnabled,
          currentDate: currentDate.toString(),
          formData: {
            client_id: formData.client_id,
            modality: formData.modality,
            recurrenceId
          }
        });
      }
      
      if (isEnabled) {
        appointments.push({
          client_id: formData.client_id,
          modality: formData.modality,
          date: currentDate.toISOString(),
          status: 'agendado',
          recurrence_id: recurrenceId, // Usar o UUID da recorrência
          booking_source: 'manual', // Agendamentos manuais sempre têm source 'manual'
          user_id: userId
        });
      } else {
        // Debug para dias não habilitados
        console.log('🔍 NewAppointmentModal - Dia não habilitado:', {
          date: currentDate.toISOString(),
          dayOfWeek,
          dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek],
          isEnabled
        });
      }

      // Avançar para próxima semana
      currentDate.setDate(currentDate.getDate() + 7);
      count++;
    }

    console.log('🔍 NewAppointmentModal - Agendamentos gerados:', {
      total: appointments.length,
      firstDate: appointments[0]?.date,
      lastDate: appointments[appointments.length - 1]?.date,
      recurrenceId,
      userId
    });

    return appointments;
  };

  const availableTimeSlots = getAvailableTimeSlots(formData.date);
  
  // Debug: verificar horários disponíveis
  console.log('🔍 NewAppointmentModal - Horários disponíveis:', {
    date: formData.date,
    selectedTime,
    availableTimeSlots,
    formDataTime: formData.time,
    formDataTimeType: typeof formData.time,
    formDataTimeLength: formData.time?.length
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div>
            <Label htmlFor="client">Cliente *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modalidade */}
          <div>
            <Label htmlFor="modality">Modalidade *</Label>
            <Select
              value={formData.modality_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, modality_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma modalidade" />
              </SelectTrigger>
              <SelectContent>
                {modalities.map((modality) => (
                  <SelectItem key={modality.id} value={modality.id}>
                    {modality.name} – R$ {modality.valor.toFixed(2).replace('.', ',')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div>
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              // min={format(new Date(), 'yyyy-MM-dd')} // Removido para permitir datas passadas
            />
          </div>

          {/* Horário */}
          <div>
            <Label htmlFor="time">Horário *</Label>
            <Select
              key={`time-select-${formData.time}-${selectedTime}`} // Força re-render quando valores mudam
              value={formData.time || selectedTime || ''}
              onValueChange={(value) => {
                console.log('🔍 NewAppointmentModal - Horário selecionado:', value);
                console.log('🔍 NewAppointmentModal - Valor atual do formData.time:', formData.time);
                console.log('🔍 NewAppointmentModal - Horários disponíveis:', availableTimeSlots);
                setFormData(prev => ({ ...prev, time: value }));
              }}
              disabled={!formData.date || availableTimeSlots.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.date 
                    ? "Selecione uma data primeiro" 
                    : availableTimeSlots.length === 0 
                      ? "Nenhum horário disponível" 
                      : (formData.time || selectedTime)
                        ? `Horário selecionado: ${formData.time || selectedTime}`
                        : "Selecione um horário"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.date && availableTimeSlots.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Nenhum horário disponível para esta data
              </p>
            )}
          </div>

          {/* Recorrência */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isRecurring: checked as boolean }))
              }
            />
            <Label htmlFor="recurring">Agendamento recorrente</Label>
          </div>

          {formData.isRecurring && (
            <div className="space-y-4 pl-6 border-l-2 border-muted">
              <div>
                <Label>Tipo de recorrência</Label>
                <Select
                  value={formData.recurrenceType}
                  onValueChange={(value: 'data_final' | 'repeticoes' | 'indeterminado') => 
                    setFormData(prev => ({ ...prev, recurrenceType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_final">Até uma data final</SelectItem>
                    <SelectItem value="repeticoes">Número de repetições</SelectItem>
                    <SelectItem value="indeterminado">Indeterminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recurrenceType === 'data_final' && (
                <div>
                  <Label htmlFor="endDate">Data final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    min={formData.date}
                  />
                </div>
              )}

              {formData.recurrenceType === 'repeticoes' && (
                <div>
                  <Label htmlFor="repetitions">Número de repetições</Label>
                  <Input
                    id="repetitions"
                    type="number"
                    min="1"
                    max="52"
                    value={formData.repetitions}
                    onChange={(e) => setFormData(prev => ({ ...prev, repetitions: parseInt(e.target.value) }))}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Criando...' : 'Criar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
