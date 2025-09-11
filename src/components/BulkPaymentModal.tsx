import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, CheckCircle, DollarSign, Calendar, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Appointment {
  id: string;
  date: string;
  status: string;
  modality: string;
  valor_total: number;
  client: {
    name: string;
  };
}

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  appointments: Appointment[];
  onPaymentCompleted: () => void;
}

const BulkPaymentModal = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  appointments,
  onPaymentCompleted
}: BulkPaymentModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'total' | 'partial'>('total');

  // Filtrar apenas agendamentos que podem ser pagos (a_cobrar)
  const payableAppointments = appointments.filter(apt => apt.status === 'a_cobrar');

  // Calcular valor total dos agendamentos selecionados
  const totalSelectedAmount = selectedAppointments.reduce((total, aptId) => {
    const appointment = payableAppointments.find(apt => apt.id === aptId);
    return total + (appointment?.valor_total || 0);
  }, 0);

  // Resetar estado quando modal abre
  useEffect(() => {
    if (isOpen) {
      setSelectedAppointments([]);
      setPaymentAmount(0);
      setPaymentType('total');
    }
  }, [isOpen]);

  // Atualizar valor quando seleção muda
  useEffect(() => {
    if (paymentType === 'total') {
      setPaymentAmount(totalSelectedAmount);
    }
  }, [selectedAppointments, paymentType, totalSelectedAmount]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAppointments(payableAppointments.map(apt => apt.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAppointments(prev => [...prev, appointmentId]);
    } else {
      setSelectedAppointments(prev => prev.filter(id => id !== appointmentId));
    }
  };

  const handlePaymentTypeChange = (type: 'total' | 'partial') => {
    setPaymentType(type);
    if (type === 'total') {
      setPaymentAmount(totalSelectedAmount);
    } else {
      setPaymentAmount(0);
    }
  };

  const handleSubmit = async () => {
    if (selectedAppointments.length === 0) {
      toast({
        title: 'Selecione agendamentos',
        description: 'Selecione pelo menos um agendamento para pagar.',
        variant: 'destructive',
      });
      return;
    }

    if (paymentAmount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'O valor do pagamento deve ser maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 BulkPayment - Iniciando pagamento:', {
        paymentType,
        selectedAppointments,
        paymentAmount
      });

      if (paymentType === 'total') {
        // Marcar todos os agendamentos selecionados como pagos
        console.log('🔍 BulkPayment - Atualizando agendamentos para pago:', selectedAppointments);
        
        console.log('🔍 BulkPayment - IDs dos agendamentos a atualizar:', selectedAppointments);
        
        const { data, error } = await supabase
          .from('appointments')
          .update({ status: 'pago' })
          .in('id', selectedAppointments)
          .select('id, status');

        if (error) {
          console.error('🔍 BulkPayment - Erro ao atualizar:', error);
          throw error;
        }

        console.log('🔍 BulkPayment - Dados atualizados:', data);

        console.log('🔍 BulkPayment - Agendamentos atualizados com sucesso');
        
        toast({
          title: 'Pagamento realizado!',
          description: `${selectedAppointments.length} agendamentos foram marcados como pagos. Recarregue a página para ver as alterações.`,
          duration: 5000,
        });
      } else {
        // Pagamento parcial - marcar como pago apenas os agendamentos que cabem no valor
        let remainingAmount = paymentAmount;
        const appointmentsToMarkAsPaid: string[] = [];

        // Ordenar agendamentos por valor (menor primeiro)
        const sortedAppointments = payableAppointments
          .filter(apt => selectedAppointments.includes(apt.id))
          .sort((a, b) => a.valor_total - b.valor_total);

        for (const appointment of sortedAppointments) {
          if (remainingAmount >= appointment.valor_total) {
            appointmentsToMarkAsPaid.push(appointment.id);
            remainingAmount -= appointment.valor_total;
          } else {
            break;
          }
        }

        if (appointmentsToMarkAsPaid.length > 0) {
          const { error } = await supabase
            .from('appointments')
            .update({ status: 'pago' })
            .in('id', appointmentsToMarkAsPaid);

          if (error) throw error;

          toast({
            title: 'Pagamento parcial realizado!',
            description: `${appointmentsToMarkAsPaid.length} agendamentos foram marcados como pagos.`,
          });
        } else {
          toast({
            title: 'Valor insuficiente',
            description: 'O valor informado não é suficiente para pagar nenhum agendamento.',
            variant: 'destructive',
          });
          return;
        }
      }

      console.log('🔍 BulkPayment - Chamando onPaymentCompleted');
      onPaymentCompleted();
      onClose();
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/60">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-800">
              <DollarSign className="h-6 w-6" />
              Pagamento em Lote - {clientName}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Resumo do Cliente */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">{clientName}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Total a Cobrar:</span>
                <span className="font-semibold text-orange-600 ml-2">
                  {formatCurrency(payableAppointments.reduce((sum, apt) => sum + apt.valor_total, 0))}
                </span>
              </div>
              <div>
                <span className="text-slate-600">Agendamentos:</span>
                <span className="font-semibold text-slate-800 ml-2">
                  {payableAppointments.length}
                </span>
              </div>
            </div>
          </div>

          {/* Seleção de Agendamentos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Selecionar Agendamentos</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedAppointments.length === payableAppointments.length && payableAppointments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">Selecionar Todos</Label>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {payableAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <Checkbox
                    id={appointment.id}
                    checked={selectedAppointments.includes(appointment.id)}
                    onCheckedChange={(checked) => handleSelectAppointment(appointment.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium">
                          {format(new Date(appointment.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        {formatCurrency(appointment.valor_total)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{appointment.modality}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de Pagamento */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Tipo de Pagamento</Label>
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant={paymentType === 'total' ? 'default' : 'outline'}
                onClick={() => handlePaymentTypeChange('total')}
                className="h-12 justify-start"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Pagamento Total dos Agendamentos Selecionados
              </Button>
              <Button
                variant={paymentType === 'partial' ? 'default' : 'outline'}
                onClick={() => handlePaymentTypeChange('partial')}
                className="h-12 justify-start"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Pagamento Parcial (valor específico)
              </Button>
            </div>
          </div>

          {/* Valor do Pagamento */}
          {paymentType === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Valor do Pagamento</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                max={totalSelectedAmount}
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                placeholder="Digite o valor"
                className="text-lg font-semibold"
              />
              <p className="text-sm text-slate-600">
                Máximo: {formatCurrency(totalSelectedAmount)}
              </p>
            </div>
          )}

          {/* Resumo do Pagamento */}
          {selectedAppointments.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Resumo do Pagamento</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Agendamentos selecionados:</span>
                  <span className="font-semibold">{selectedAppointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor total selecionado:</span>
                  <span className="font-semibold">{formatCurrency(totalSelectedAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span>Valor a pagar:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(paymentAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedAppointments.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BulkPaymentModal;
