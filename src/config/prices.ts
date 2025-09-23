export const PRICES = {
  MENSAL: import.meta.env.VITE_STRIPE_PRICE_MENSAL as string,
  TRIMESTRAL: import.meta.env.VITE_STRIPE_PRICE_TRIMESTRAL as string,
  ANUAL: import.meta.env.VITE_STRIPE_PRICE_ANUAL as string,
};

export type PlanKey = keyof typeof PRICES;


