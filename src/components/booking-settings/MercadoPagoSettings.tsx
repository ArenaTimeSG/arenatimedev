import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Save, AlertCircle, Info, Eye, EyeOff, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';
import { ComingSoonCard } from './ComingSoonCard';

interface MercadoPagoSettingsProps {
  mercadoPagoEnabled: boolean;
  accessToken: string;
  publicKey: string;
  webhookUrl: string;
  onUpdate: (settings: {
    mercado_pago_enabled: boolean;
    mercado_pago_access_token: string;
    mercado_pago_public_key: string;
    mercado_pago_webhook_url: string;
  }) => void;
}

const MercadoPagoSettings = ({
  mercadoPagoEnabled,
  accessToken,
  publicKey,
  webhookUrl,
  onUpdate
}: MercadoPagoSettingsProps) => {
  const [isEnabled, setIsEnabled] = useState(mercadoPagoEnabled);
  const [token, setToken] = useState(accessToken);
  const [key, setKey] = useState(publicKey);
  const [webhook, setWebhook] = useState(webhookUrl);
  const [showToken, setShowToken] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [testando, setTestando] = useState(false);
  
  const { createPaymentPreference } = usePayment();
  const { toast } = useToast();

  // Sincronizar estado local com props quando elas mudarem
  useEffect(() => {
    setIsEnabled(mercadoPagoEnabled);
    setToken(accessToken);
    setKey(publicKey);
    setWebhook(webhookUrl);
  }, [mercadoPagoEnabled, accessToken, publicKey, webhookUrl]);

  const handleSalvar = async () => {
    setSalvando(true);
    
    try {
      await onUpdate({
        mercado_pago_enabled: isEnabled,
        mercado_pago_access_token: token,
        mercado_pago_public_key: key,
        mercado_pago_webhook_url: webhook
      });
      
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch (error) {
      console.error('❌ Erro ao salvar configurações do Mercado Pago:', error);
    } finally {
      setSalvando(false);
    }
  };

  const handleTestarConfiguracao = async () => {
    if (!isEnabled || !token) {
      toast({
        title: 'Configuração Incompleta',
        description: 'Habilite o Mercado Pago e configure o Access Token antes de testar.',
        variant: 'destructive',
      });
      return;
    }

    setTestando(true);
    
    try {
      // Primeiro salvar as configurações atuais
      await onUpdate({
        mercado_pago_enabled: isEnabled,
        mercado_pago_access_token: token,
        mercado_pago_public_key: key,
        mercado_pago_webhook_url: webhook
      });

      // Aguardar um pouco para as configurações serem salvas
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Testar criando uma preferência de pagamento de teste
      const testData = {
        user_id: '49014464-6ed9-4fee-af45-06105f31698b', // UUID válido para teste
        amount: 10.00,
        description: 'Teste de Configuração',
        client_name: 'Cliente Teste',
        client_email: 'teste@exemplo.com',
      };

      console.log('🧪 Testando configuração do Mercado Pago...');
      const result = await createPaymentPreference(testData);
      
      if (result && (result.sandbox_init_point || result.init_point)) {
        toast({
          title: '✅ Configuração Funcionando!',
          description: 'Sua configuração do Mercado Pago está correta e funcionando.',
          duration: 5000,
        });
      } else {
        throw new Error('URL de pagamento não foi retornada');
      }
    } catch (error) {
      console.error('❌ Erro no teste de configuração:', error);
      
      let errorMessage = 'Erro ao testar configuração.';
      
      if (error.message) {
        if (error.message.includes('Mercado Pago não está habilitado')) {
          errorMessage = 'Mercado Pago não está habilitado.';
        } else if (error.message.includes('Access Token')) {
          errorMessage = 'Access Token inválido ou não configurado.';
        } else if (error.message.includes('Configuração do servidor')) {
          errorMessage = 'Problema na configuração do servidor.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: '❌ Erro na Configuração',
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setTestando(false);
    }
  };

  const hasChanges = 
    isEnabled !== mercadoPagoEnabled ||
    token !== accessToken ||
    key !== publicKey ||
    webhook !== webhookUrl;

  const maskToken = (token: string) => {
    if (!token) return '';
    if (token.length <= 8) return token;
    return token.substring(0, 4) + '•'.repeat(token.length - 8) + token.substring(token.length - 4);
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <ComingSoonCard
      title="Configurações do Mercado Pago"
      description="Configure Access Token, Public Key e Webhook para processar pagamentos via Mercado Pago nos agendamentos online"
      icon={<CreditCard className="w-6 h-6 text-blue-600" />}
    />
  );
};

export { MercadoPagoSettings };
