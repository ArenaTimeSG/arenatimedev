import { useEffect } from 'react';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoScriptProps {
  publicKey: string;
}

const MercadoPagoScript: React.FC<MercadoPagoScriptProps> = ({ publicKey }) => {
  useEffect(() => {
    // Verificar se o script já foi carregado
    if (window.MercadoPago) {
      console.log('✅ [FRONTEND] SDK do Mercado Pago já carregado');
      return;
    }

    // Carregar o script do Mercado Pago
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ [FRONTEND] SDK do Mercado Pago carregado com sucesso');
      
      // Aguardar um pouco para garantir que o SDK esteja totalmente carregado
      setTimeout(() => {
        if (window.MercadoPago && typeof window.MercadoPago.setPublishableKey === 'function') {
          window.MercadoPago.setPublishableKey(publicKey);
          console.log('✅ [FRONTEND] Mercado Pago configurado com chave pública');
        } else {
          console.error('❌ [FRONTEND] SDK do Mercado Pago não está disponível ou setPublishableKey não é uma função');
        }
      }, 100);
    };
    
    script.onerror = () => {
      console.error('❌ [FRONTEND] Erro ao carregar SDK do Mercado Pago');
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [publicKey]);

  return null; // Este componente não renderiza nada
};

export default MercadoPagoScript;
