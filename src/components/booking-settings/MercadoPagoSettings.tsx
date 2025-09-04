import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Save, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200/60 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-800">
              Configurações do Mercado Pago
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configure sua conta do Mercado Pago para receber pagamentos
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Toggle de Ativação */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <Label className="text-base font-medium text-gray-700">Habilitar Mercado Pago</Label>
            <p className="text-sm text-gray-600">
              Ative para permitir pagamentos online
            </p>
          </div>
          <Switch 
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>

        {isEnabled && (
          <>
            {/* Access Token */}
            <div className="space-y-2">
              <Label htmlFor="access-token" className="text-sm font-medium text-gray-700">
                Access Token do Mercado Pago
              </Label>
              <div className="relative">
                <Input
                  id="access-token"
                  type={showToken ? "text" : "password"}
                  value={showToken ? token : maskToken(token)}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="TEST-1234567890-123456-abcdef1234567890abcdef1234567890-12345678"
                  className="pr-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Token de acesso da sua aplicação no Mercado Pago
              </p>
            </div>

            {/* Public Key */}
            <div className="space-y-2">
              <Label htmlFor="public-key" className="text-sm font-medium text-gray-700">
                Public Key do Mercado Pago
              </Label>
              <div className="relative">
                <Input
                  id="public-key"
                  type={showKey ? "text" : "password"}
                  value={showKey ? key : maskKey(key)}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="TEST-12345678-1234-1234-1234-123456789012"
                  className="pr-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Chave pública da sua aplicação no Mercado Pago
              </p>
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhook-url" className="text-sm font-medium text-gray-700">
                URL do Webhook (Opcional)
              </Label>
              <Input
                id="webhook-url"
                type="url"
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
                placeholder="https://seu-dominio.com/webhook/mercado-pago"
              />
              <p className="text-xs text-gray-500">
                URL personalizada para receber notificações (deixe vazio para usar a padrão)
              </p>
            </div>
          </>
        )}

        {/* Informações Importantes */}
        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Como Obter suas Chaves</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Acesse <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="underline">Mercado Pago Developers</a></li>
                <li>• Faça login na sua conta</li>
                <li>• Vá para "Suas integrações"</li>
                <li>• Copie o Access Token e Public Key</li>
                <li>• Use tokens de TESTE para desenvolvimento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Informações de Segurança */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Segurança</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Suas chaves são armazenadas de forma segura</li>
                <li>• Apenas você pode ver e editar suas configurações</li>
                <li>• Use sempre HTTPS em produção</li>
                <li>• Mantenha suas chaves em segredo</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {hasChanges && (
                <span className="text-orange-600 font-medium">
                  ⚠️ Alterações não salvas
                </span>
              )}
            </div>
            
            <motion.button
              onClick={handleSalvar}
              disabled={!hasChanges || salvando}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                hasChanges && !salvando
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={hasChanges && !salvando ? { scale: 1.02 } : {}}
              whileTap={hasChanges && !salvando ? { scale: 0.98 } : {}}
            >
              {salvando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : salvo ? (
                <>
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </>
              )}
            </motion.button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { MercadoPagoSettings };
