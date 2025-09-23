import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

export type SubscriptionRow = {
  id: string;
  user_id: string;
  stripe_id: string;
  status: string;
  current_period_end: string;
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (!userId) {
        setSubscription(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mounted) {
        if (error) console.error('useSubscription error', error);
        setSubscription(data as any);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isActive = (() => {
    if (!subscription) return false;
    const validStatuses = new Set(['active', 'trialing']);
    const statusOk = validStatuses.has(subscription.status);
    const end = new Date(subscription.current_period_end).getTime();
    const now = Date.now();
    return statusOk && end > now;
  })();

  return { subscription, isActive, loading };
}


