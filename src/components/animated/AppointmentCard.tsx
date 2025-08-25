import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Calendar, RotateCcw } from 'lucide-react';

interface AppointmentCardProps {
  appointment: {
    id: string;
    client: { name: string };
    modality: string;
    status: 'a_cobrar' | 'pago' | 'cancelado' | 'agendado';
    recurrence_id?: string;
  };
  onClick: () => void;
  getStatusColor: (status: string, date?: string, recurrence_id?: string) => string;
  getStatusLabel: (status: string, date?: string) => string;
  date?: string;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onClick,
  getStatusColor,
  getStatusLabel,
  date,
}) => {
  // Determinar a cor baseada no tipo de agendamento (recorrente vs único)
  const getGradientClass = () => {
    if (appointment.recurrence_id) {
      // Agendamento recorrente - tons de azul
      switch (appointment.status) {
        case 'pago': return 'from-blue-500 to-blue-600';
        case 'a_cobrar': return 'from-blue-500 to-blue-600';
        case 'agendado': return 'from-blue-500 to-blue-600';
        case 'cancelado': return 'from-gray-400 to-gray-600';
        default: return 'from-blue-500 to-blue-600';
      }
    } else {
      // Agendamento único - tons de roxo
      switch (appointment.status) {
        case 'pago': return 'from-violet-500 to-violet-600';
        case 'a_cobrar': return 'from-violet-500 to-violet-600';
        case 'agendado': return 'from-violet-500 to-violet-600';
        case 'cancelado': return 'from-gray-400 to-gray-600';
        default: return 'from-violet-500 to-violet-600';
      }
    }
  };

  // Determinar a cor do badge baseada no status
  const getBadgeColor = () => {
    switch (appointment.status) {
      case 'pago': return 'bg-green-500 text-white border-green-600';
      case 'a_cobrar': return 'bg-orange-500 text-white border-orange-600';
      case 'agendado': return 'bg-white/20 text-white border-white/30';
      case 'cancelado': return 'bg-gray-500 text-white border-gray-600';
      default: return 'bg-orange-500 text-white border-orange-600';
    }
  };

  const gradientClass = getGradientClass();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{ 
        y: -2,
        boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      }}
      whileTap={{ y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative overflow-hidden rounded-lg cursor-pointer p-2 h-full w-full
        bg-gradient-to-br ${gradientClass} text-white
        shadow-md hover:shadow-lg transition-all duration-200
        border-0 backdrop-blur-sm
      `}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
      </div>

      <div className="relative space-y-1">
        {/* Header with status and recurrence indicator */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className={`text-xs font-semibold ${getBadgeColor()}`}
          >
            {getStatusLabel(appointment.status, date)}
          </Badge>
          {appointment.recurrence_id && (
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <RotateCcw className="h-3 w-3 text-white/80" />
            </motion.div>
          )}
        </div>

        {/* Client name */}
        <div className="space-y-0">
          <p className="font-semibold text-xs leading-tight line-clamp-2">
            {appointment.client.name}
          </p>
          
          {/* Modality */}
          <div className="flex items-center gap-1 opacity-90">
            <Calendar className="h-2 w-2" />
            <p className="text-xs font-medium">
              {appointment.modality}
            </p>
          </div>
        </div>

        {/* Recurrence indicator */}
        {appointment.recurrence_id && (
          <motion.div 
            className="flex items-center gap-1 text-xs font-medium opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-1 h-1 bg-white rounded-full" />
            <span>Recorrente</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
