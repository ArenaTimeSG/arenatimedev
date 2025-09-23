import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';

type Props = { children: ReactNode };

export default function RequireSubscription({ children }: Props) {
  const { isActive, loading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isActive) {
      navigate('/pricing');
    }
  }, [loading, isActive, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-slate-600">Verificando assinatura...</div>
      </div>
    );
  }

  if (!isActive) return null;
  return <>{children}</>;
}


