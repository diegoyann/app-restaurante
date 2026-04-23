function optionalList(name) {
  return String(process.env[name] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://invalid-project.supabase.co',
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_placeholder_key',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || 'sb_secret_placeholder_key',
  corsAllowedOrigins: optionalList('CORS_ALLOWED_ORIGINS')
};
