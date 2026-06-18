export const ENV = {
  // App
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? "",

  // Legacy Manus OAuth (kept for backwards compat during migration)
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",

  // Manus Forge API (replace with OpenAI for self-hosting)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "",

  // Tap Payment Gateway
  tapSecretKey: process.env.TAP_SECRET_KEY ?? "",
  tapPublicKey: process.env.TAP_PUBLIC_KEY ?? "",
  tapWebhookSecret: process.env.TAP_WEBHOOK_SECRET ?? "",

  // ElevenLabs Voice
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",

  // Resend Email
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
};
