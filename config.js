/* Configuración del funnel "Reto Panza de Mamá 21". Lo único que hay que tocar para lanzar. */
window.DIA_CONFIG = {
  OFFER: "diastasis",                       // clave de esta oferta en el panel /panel (funnel_events.offer)
  BRAND: "Reto Panza de Mamá 21",
  PRODUCT: "Reto Panza de Mamá 21",         // igual que en KashPay
  PRODUCT_90: "Plan Abdomen Firme 90",      // upsell

  // Meta Pixel: vacío = no se carga ningún píxel (Franco: píxel nuevo por oferta).
  META_PIXEL_ID: "",

  // Checkout principal (USD 9) en KashPay con 2 order bumps (Acceso prioritario 4 · Menú Desinflama 5) y embudo upsell 47 → downsell 23.
  CHECKOUT_URL: "https://whop.com/checkout/plan_q3DBr2yendDa7", // respaldo Whop (sin bumps) hasta tener el checkout de KashPay
  // Upsell / downsell one-click de KashPay (tokens del embudo). Respaldo Whop abajo.
  KP_UPSELL: "",
  KP_DOWNSELL: "",
  UPSELL_URL: "https://whop.com/checkout/plan_94up9Yeti6vpv",   // Plan Abdomen Firme 90 · USD 47 (respaldo, cobro aparte)
  DOWNSELL_URL: "https://whop.com/checkout/plan_XaXUkxZWoj2tU", // mismo plan · USD 23 (respaldo)

  // Medición por etapa (Franco 7.x): aterrizaje → inicio → resultado → oferta → clic. Va a Supabase vía la app.
  TRACK_URL: "https://panza-app-production.up.railway.app/api/t",
  APP_URL: "https://panza-app-production.up.railway.app",

  PRICE: 9,
  PRICE_OLD: 47,
  ANCHOR: 197,
  PRICE_MXN_NOTE: "≈ 170 pesos mexicanos",
  CURRENCY: "USD",
  TIMER_MINUTES: 10,
  GUARANTEE_DAYS: 30,

  SHOW_TESTIMONIAL_NOTE: true,
  // Vídeos testimonio (Franco L 4.4: 2 por embudo). Vacío = no se muestran.
  VIDEOS: []
};
