// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

export const handler = async (req: Request): Promise<Response> => {
  console.log('🎯 Stripe webhook recebido');
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error('❌ Env faltando', { hasSecret: !!STRIPE_SECRET_KEY, hasWebhook: !!STRIPE_WEBHOOK_SECRET, hasUrl: !!SUPABASE_URL, hasService: !!SERVICE_ROLE });
    return new Response('Missing env vars', { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');
  let event: Stripe.Event;
  try {
    if (!sig) throw new Error('No signature');
    // Use async verification in Deno (uses SubtleCrypto under the hood)
    // @ts-ignore - types may not include constructEventAsync
    event = await (stripe.webhooks as any).constructEventAsync(
      rawBody,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('❌ Erro na verificação da assinatura:', err?.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log('📦 Evento recebido:', event.type);

  const upsertSubscription = async (sub: Stripe.Subscription) => {
    const userId = (sub.metadata as any)?.userId;
    console.log('🧾 Subscription:', { id: sub.id, status: sub.status, userId });
    if (!userId) {
      console.log('ℹ️ Sem userId na metadata; ignorando upsert');
      return new Response('ok');
    }

    const periodEndMs = typeof sub.current_period_end === 'number' ? sub.current_period_end * 1000 : undefined;
    const periodEndIso = periodEndMs ? new Date(periodEndMs).toISOString() : null;

    const payload = {
      stripe_id: sub.id,
      user_id: userId ?? null,
      status: sub.status,
      current_period_end: periodEndIso,
    };

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE,
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('❌ Erro ao salvar no Supabase:', resp.status, txt);
      return new Response(`Supabase error: ${txt}`, { status: 500 });
    }
    console.log('✅ Subscription salva/atualizada no Supabase');
    return new Response('ok');
  };

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    return await upsertSubscription(sub);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('✅ Checkout concluído para session:', session.id, 'subscription:', session.subscription);
    // Não buscar assinatura aqui para evitar erros do event loop; os próximos eventos de subscription cuidarão do upsert
    return new Response('ok');
  }

  return new Response('ok');
};

Deno.serve(handler);


