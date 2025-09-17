import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface EventActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string | null;
  currentStatus?: 'a_cobrar' | 'pago' | 'cancelado';
  onUpdateStatus: (status: 'a_cobrar' | 'pago' | 'cancelado') => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  info?: {
    clientName: string;
    phone?: string;
    amount: number;
    startTime: string;
    endTime: string;
    notes?: string;
    guests?: number;
  } | null;
  onSave?: (data: {
    clientName: string;
    phone?: string;
    amount: number;
    startTime: string;
    endTime: string;
    notes?: string;
    guests?: number;
    status: 'a_cobrar' | 'pago' | 'cancelado';
  }) => Promise<void> | void;
}

const EventActionsModal: React.FC<EventActionsModalProps> = ({ isOpen, onClose, eventId, currentStatus = 'a_cobrar', onUpdateStatus, onDelete, info, onSave }) => {
  const [status, setStatus] = useState<'a_cobrar' | 'pago' | 'cancelado'>(currentStatus);
  const [clientName, setClientName] = useState(info?.clientName || '');
  const [phone, setPhone] = useState(info?.phone || '');
  const [amount, setAmount] = useState<string>(info ? String(info.amount) : '');
  const [startTime, setStartTime] = useState(info?.startTime || '18:00');
  const [endTime, setEndTime] = useState(info?.endTime || '22:00');
  const [notes, setNotes] = useState(info?.notes || '');
  const [guests, setGuests] = useState<string>(info?.guests ? String(info.guests) : '');

  // Sync when open changes
  React.useEffect(() => {
    setStatus(currentStatus);
    setClientName(info?.clientName || '');
    setPhone(info?.phone || '');
    setAmount(info ? String(info.amount) : '');
    setStartTime(info?.startTime || '18:00');
    setEndTime(info?.endTime || '22:00');
    setNotes(info?.notes || '');
    setGuests(info?.guests ? String(info.guests) : '');
  }, [isOpen, currentStatus, info]);

  if (!isOpen || !eventId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Ações do Evento</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Cliente</label>
                <input className="w-full text-sm border border-slate-200 rounded-lg p-2"
                       value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Telefone</label>
                <input className="w-full text-sm border border-slate-200 rounded-lg p-2"
                       value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+()-]/g,''))} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Valor (R$)</label>
                <input className="w-full text-sm border border-slate-200 rounded-lg p-2"
                       value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g,''))} />
              </div>
              <div>
                <label className="text-sm">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="a_cobrar">A Cobrar</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Início</label>
                <input type="time" className="w-full text-sm border border-slate-200 rounded-lg p-2" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Fim</label>
                <input type="time" className="w-full text-sm border border-slate-200 rounded-lg p-2" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm">Convidados</label>
              <input className="w-full text-sm border border-slate-200 rounded-lg p-2" value={guests} onChange={e => setGuests(e.target.value.replace(/[^0-9]/g,''))} />
            </div>
            <div>
              <label className="text-sm">Observações</label>
              <textarea className="w-full text-sm border border-slate-200 rounded-lg p-2 min-h-[80px]"
                        value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

          <div className="flex justify-between gap-3 mt-6">
          <Button variant="destructive" onClick={() => onDelete()} className="bg-red-600 hover:bg-red-700">Excluir</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="border-slate-200">Cancelar</Button>
            <Button onClick={async () => {
              // Se onSave existir, salva dados completos; caso contrário, apenas o status
              if (onSave) {
                const normalized = (amount || '').replace(/\./g,'').replace(',', '.');
                const num = parseFloat(normalized || '0');
                await onSave({
                  clientName: clientName.trim(),
                  phone: phone.trim() || undefined,
                  amount: isNaN(num) ? 0 : Number(num.toFixed(2)),
                  startTime,
                  endTime,
                  notes: notes.trim() || undefined,
                  guests: guests ? Number(guests) : 0,
                  status
                });
              } else {
                await onUpdateStatus(status);
              }
              onClose();
            }} className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventActionsModal;


