// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// Note: Import Stripe lazily to avoid initializing on CORS preflight

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400' } });
  }

  try {
    const body = await req.json();
    console.log('📩 Body recebido:', body);

    const hasStripeKey = !!Deno.env.get('STRIPE_SECRET_KEY');
    console.log('🔑 STRIPE_SECRET_KEY existe?', hasStripeKey);

    const { priceId, userId } = body ?? {};
    console.log('💳 PriceId:', priceId);
    console.log('👤 UserId:', userId);

    if (!priceId || !userId) {
      console.error('❌ Falta priceId ou userId');
      throw new Error('priceId ou userId não informado');
    }

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret missing');
    }

    const origin = req.headers.get('origin') ?? 'http://localhost:5173';
    const { default: Stripe } = await import('https://esm.sh/stripe@14.25.0?target=deno');
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
      },
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    });

    console.log('✅ Sessão criada:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('❌ Erro no create-checkout-session:', err);
    const message = typeof err?.message === 'string' ? err.message : 'Unknown error';
    // Temporário: retornar 200 com a mensagem para debug no front
    return new Response(
      JSON.stringify({ error: message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

Deno.serve(handler);


