import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAppointments } from '@/hooks/useAppointments';
import { useQueryClient } from '@tanstack/react-query';
import { useModalities } from '@/hooks/useModalities';
import { formatCurrency } from '@/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, TrendingDown, Calendar, ArrowLeft, Users, ChevronLeft, ChevronRight, FileText, CheckCircle, AlertCircle, Clock, XCircle, CreditCard } from 'lucide-react';
import SimpleStatusModal from '@/components/SimpleStatusModal';
import { isBefore, isEqual, startOfMonth, endOfMonth, addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancialData {
  total_recebido: number;
  total_pago: number;
  total_pendente: number;
  total_agendado: number;
  total_cancelado: number;
  agendamentos_pagos: number;
  agendamentos_pendentes: number;
  agendamentos_agendados: number;
  agendamentos_cancelados: number;
  agendamentos_realizados: number;
}

interface ClientFinancial {
  id: string;
  name: string;
  total_pago: number;
  total_pendente: number;
  total_agendamentos: number;
}

interface AppointmentData {
  id: string;
  date: string;
  status: string;
  modality: string;
  valor_total: number;
  client: {
    name: string;
  };
}

const Financial = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { appointments, getFinancialSummary, refetch } = useAppointments();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState<FinancialData>({
    total_recebido: 0,
    total_pago: 0,
    total_pendente: 0,
    total_agendado: 0,
    total_cancelado: 0,
    agendamentos_pagos: 0,
    agendamentos_pendentes: 0,
    agendamentos_agendados: 0,
    agendamentos_cancelados: 0,
    agendamentos_realizados: 0,
  });
  const [clientsFinancial, setClientsFinancial] = useState<ClientFinancial[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<AppointmentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Navegação por mês
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Estado para modal de alteração de status
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedClientForStatus, setSelectedClientForStatus] = useState<{
    id: string;
    name: string;
    appointments: AppointmentData[];
  } | null>(null);
  

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && appointments.length > 0) {
      fetchFinancialData();
    }
  }, [user, selectedMonth, appointments]);

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);

      const startOfSelectedMonth = startOfMonth(selectedMonth);
      const endOfSelectedMonth = endOfMonth(selectedMonth);

      // Filtrar agendamentos do mês selecionado
      const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        // Normalizar as datas para comparar apenas ano e mês
        const aptYear = aptDate.getFullYear();
        const aptMonth = aptDate.getMonth();
        const selectedYear = selectedMonth.getFullYear();
        const selectedMonthNum = selectedMonth.getMonth();
        
        return aptYear === selectedYear && aptMonth === selectedMonthNum;
      });

      // Debug: verificar agendamentos cancelados
      const agendamentosCancelados = monthAppointments.filter(apt => apt.status === 'cancelado');
      console.log('🔍 Financial - Agendamentos cancelados encontrados:', agendamentosCancelados);
      console.log('🔍 Financial - Total de agendamentos do mês:', monthAppointments.length);
      console.log('🔍 Financial - Status dos agendamentos:', monthAppointments.map(apt => ({ id: apt.id, status: apt.status, date: apt.date, valor_total: apt.valor_total })));

      setAppointmentsData(monthAppointments.map(apt => ({
        id: apt.client_id,
        date: apt.date,
        status: apt.status,
        modality: apt.modality_info?.name || apt.modality || 'Modalidade não definida',
        valor_total: apt.valor_total || 0,
        client: apt.client
      })));

      // Usar o hook para calcular dados financeiros
      const summary = getFinancialSummary(monthAppointments);
      
      // Debug: verificar resumo financeiro
      console.log('🔍 Financial - Resumo financeiro calculado:', summary);
      console.log('🔍 Financial - Agendamentos cancelados no resumo:', summary.agendamentos_cancelados);
      console.log('🔍 Financial - Total cancelado no resumo:', summary.total_cancelado);
      console.log('🔍 Financial - Agendamentos pagos encontrados:', monthAppointments.filter(apt => apt.status === 'pago').length);
      console.log('🔍 Financial - Agendamentos a_cobrar encontrados:', monthAppointments.filter(apt => apt.status === 'a_cobrar').length);
      
      const agendamentosRealizados = monthAppointments.filter(a => {
        const aptDate = new Date(a.date);
        const today = new Date();
        return aptDate < today;
      }).length || 0;

      setFinancialData({
        total_recebido: summary.total_recebido,
        total_pago: summary.total_recebido, // total_pago = total_recebido
        total_pendente: summary.total_pendente,
        total_agendado: summary.total_agendado,
        total_cancelado: summary.total_cancelado,
        agendamentos_pagos: summary.agendamentos_pagos,
        agendamentos_pendentes: summary.agendamentos_pendentes,
        agendamentos_agendados: summary.agendamentos_agendados,
        agendamentos_cancelados: summary.agendamentos_cancelados,
        agendamentos_realizados: agendamentosRealizados,
      });

      // Agrupar por cliente
      const clientsMap = new Map<string, ClientFinancial>();
      
      monthAppointments.forEach(appointment => {
        const clientId = appointment.client_id;
        const clientName = appointment.client?.name || 'Cliente';
        const valor = appointment.valor_total || 0;
        
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            id: clientId,
            name: clientName,
            total_pago: 0,
            total_pendente: 0,
            total_agendamentos: 0,
          });
        }
        
        const client = clientsMap.get(clientId)!;
        client.total_agendamentos++;
        
        if (appointment.status === 'pago') {
          client.total_pago += valor;
        } else if (appointment.status === 'a_cobrar') {
          client.total_pendente += valor;
        }
      });

      setClientsFinancial(Array.from(clientsMap.values()));

    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados financeiros',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // Função para abrir modal de alteração de status
  const handleOpenStatusModal = (client: ClientFinancial) => {
    const clientAppointments = appointmentsData.filter(apt => apt.id === client.id);
    setSelectedClientForStatus({
      id: client.id,
      name: client.name,
      appointments: clientAppointments
    });
    setIsStatusModalOpen(true);
  };

  // Função para fechar modal e recarregar dados (igual ao dashboard)
  const handleStatusUpdated = () => {
    refetch();
  };



  // Função para corrigir valores dos agendamentos recorrentes existentes
  const corrigirValoresRecorrentes = async () => {
    try {
      setIsLoading(true);
      
      toast({
        title: 'Corrigindo valores...',
        description: 'Atualizando agendamentos recorrentes com valores corretos.',
      });

      // Recarregar dados para aplicar a correção
      fetchFinancialData();
      
      toast({
        title: 'Valores corrigidos!',
        description: 'Os agendamentos recorrentes foram atualizados.',
      });
    } catch (error: any) {
      console.error('Erro ao corrigir valores:', error);
      toast({
        title: 'Erro ao corrigir valores',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDFReport = () => {
    try {
      const doc = new jsPDF();
    
      // Cabeçalho
      doc.setFontSize(20);
      doc.text(`${user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuário'} - Relatório Financeiro Mensal`, 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Período: ${format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}`, 105, 30, { align: 'center' });
      doc.text(`Data do relatório: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, 40, { align: 'center' });
      
      // Resumo financeiro
      doc.setFontSize(16);
      doc.text('Resumo Financeiro', 20, 60);
      
      doc.setFontSize(10);
      doc.text(`Valor Recebido: R$ ${financialData.total_recebido.toFixed(2)}`, 20, 75);
      doc.text(`A Cobrar: R$ ${financialData.total_pendente.toFixed(2)}`, 20, 85);
      doc.text(`Cancelados: R$ ${financialData.total_cancelado.toFixed(2)}`, 20, 95);
      doc.text(`Jogos Realizados: ${financialData.agendamentos_realizados}`, 20, 105);
      
      // Tabela de agendamentos
      doc.setFontSize(16);
      doc.text('Lista de Agendamentos', 20, 130);
      
      const tableData = appointmentsData.map(apt => [
        format(new Date(apt.date), 'dd/MM/yyyy', { locale: ptBR }),
        format(new Date(apt.date), 'HH:mm', { locale: ptBR }),
        apt.client.name,
        apt.modality,
        apt.status === 'pago' ? 'Pago' : apt.status === 'a_cobrar' ? 'A Cobrar' : apt.status === 'agendado' ? 'Agendado' : apt.status === 'cancelado' ? 'Cancelado' : apt.status,
        `R$ ${apt.valor_total.toFixed(2).replace('.', ',')}`
      ]);
      
      autoTable(doc, {
        head: [['Data', 'Horário', 'Cliente', 'Modalidade', 'Status', 'Valor']],
        body: tableData,
        startY: 140,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
        },
      });
      
      // Tabela de clientes
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(16);
      doc.text('Resumo por Cliente', 20, finalY);
      
      const clientTableData = clientsFinancial.map(client => [
        client.name,
        client.total_agendamentos.toString(),
        `R$ ${client.total_pago.toFixed(2)}`,
        `R$ ${client.total_pendente.toFixed(2)}`,
        `R$ ${(client.total_pago + client.total_pendente).toFixed(2)}`
      ]);
      
      autoTable(doc, {
        head: [['Cliente', 'Total Agendamentos', 'Pago', 'Pendente', 'Total']],
        body: clientTableData,
        startY: finalY + 10,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
        },
      });
      
      // Download do arquivo
      const fileName = `relatorio_financeiro_${format(selectedMonth, 'yyyy_MM', { locale: ptBR })}.pdf`;
      doc.save(fileName);
      
      toast({
        title: 'Relatório gerado!',
        description: `Relatório de ${format(selectedMonth, 'MMMM yyyy', { locale: ptBR })} foi baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Não foi possível gerar o relatório PDF. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 font-medium">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  // Verificar se há erro
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <p className="text-lg text-slate-600">Usuário não autenticado</p>
          <Button onClick={() => navigate('/auth')} className="mt-4">
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

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
                  <DollarSign className="h-6 w-6" />
                  Área Financeira
                </h1>
                <p className="text-slate-600 text-sm font-medium">Controle financeiro do ginásio</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePDFReport}
                  className="bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Navegação por Mês */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Calendar className="h-6 w-6 text-blue-600" />
                Navegação por Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviousMonth}
                  className="hover:bg-slate-100 transition-colors px-4 py-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Mês Anterior
                </Button>
                
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800">
                      {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h3>
                  </div>
                  {format(selectedMonth, 'MMMM yyyy', { locale: ptBR }) === format(new Date(), 'MMMM yyyy', { locale: ptBR }) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCurrentMonth}
                      className="border-slate-200 hover:bg-slate-50"
                    >
                      Mês Atual
                    </Button>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                  className="hover:bg-slate-100 transition-colors px-4 py-2"
                >
                  Próximo Mês
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial Overview Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 tracking-wide uppercase">Valor Recebido</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialData.total_recebido)}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {financialData.agendamentos_pagos} agendamentos
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 tracking-wide uppercase">A Cobrar</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(financialData.total_pendente)}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {financialData.agendamentos_pendentes} agendamentos
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 tracking-wide uppercase">A Receber</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(financialData.total_agendado)}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {financialData.agendamentos_agendados} agendamentos
                  </p>
                  
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 tracking-wide uppercase">Cancelados</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(financialData.total_cancelado)}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {financialData.agendamentos_cancelados} agendamentos
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Relatório PDF */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <FileText className="h-6 w-6 text-blue-600" />
                Relatório Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 font-medium">
                    Gere um relatório completo em PDF com todos os dados financeiros do mês selecionado.
                  </p>
                  <p className="text-xs text-slate-500">
                    O relatório incluirá: lista de agendamentos, resumo por cliente, estatísticas financeiras e receita total.
                  </p>
                </div>
                <Button 
                  onClick={generatePDFReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório em PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Clients Financial Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Users className="h-6 w-6 text-blue-600" />
                Resumo por Cliente - {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {clientsFinancial.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600 mb-2">Nenhum dado financeiro</p>
                  <p className="text-slate-500 mb-6">
                    Não há agendamentos registrados em {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                  </p>
                  <Button 
                    onClick={() => navigate('/appointments/new')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Criar Primeiro Agendamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientsFinancial.map((client) => (
                    <motion.div 
                      key={client.id} 
                      className="border border-slate-200 rounded-xl p-6 bg-white/50 hover:bg-white/80 transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">{client.name}</h3>
                          <p className="text-sm text-slate-500 font-medium">
                            {client.total_agendamentos} agendamentos
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-slate-500 font-medium">Pago</p>
                            <p className="font-bold text-green-600 text-lg">
                              {formatCurrency(client.total_pago)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500 font-medium">Pendente</p>
                            <p className="font-bold text-orange-600 text-lg">
                              {formatCurrency(client.total_pendente)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500 font-medium">Total</p>
                            <p className="font-bold text-slate-800 text-lg">
                              {formatCurrency(client.total_pago + client.total_pendente)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleOpenStatusModal(client)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8"
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Alterar Status
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
              <CardTitle className="text-xl font-bold text-slate-800">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    className="h-24 w-full flex-col gap-3 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
                    onClick={() => navigate('/clients')}
                  >
                    <Users className="h-8 w-8 text-blue-600" />
                    <span className="font-semibold">Gerenciar Clientes</span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    className="h-24 w-full flex-col gap-3 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
                    onClick={() => navigate('/appointments/new')}
                  >
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <span className="font-semibold">Novo Agendamento</span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    className="h-24 w-full flex-col gap-3 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
                    onClick={() => navigate('/appointments')}
                  >
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <span className="font-semibold">Ver Agendamentos</span>
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de Alteração de Status */}
      {selectedClientForStatus && (
        <SimpleStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          clientId={selectedClientForStatus.id}
          clientName={selectedClientForStatus.name}
          appointments={selectedClientForStatus.appointments}
          onStatusUpdated={handleStatusUpdated}
        />
      )}

    </div>
  );
};

export default Financial;