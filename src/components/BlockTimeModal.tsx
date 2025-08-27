import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface BlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  onBlocked: (reason: string) => void;
}

const BlockTimeModal: React.FC<BlockTimeModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  onBlocked
}) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !reason.trim()) {
      toast({ title: "Erro", description: "Preencha o motivo do bloqueio", variant: "destructive" });
      return;
    }

    // Chamar a função de bloqueio com o motivo
    onBlocked(reason.trim());
    
    toast({ title: "Sucesso", description: "Horário bloqueado com sucesso!" });
    setReason('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Bloquear Horário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do horário selecionado */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Data:</span>
                <span>{selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Horário:</span>
                <span>{selectedTime}</span>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Motivo do Bloqueio *
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Manutenção, Evento, Feriado..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição (opcional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes adicionais sobre o bloqueio..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Bloquear Horário
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlockTimeModal;
