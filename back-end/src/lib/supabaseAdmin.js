import { createClient } from '@supabase/supabase-js';
import { instrumentSupabaseClient } from './bootstrapTrace.js';
import { env } from './env.js';

export const supabaseAdmin = instrumentSupabaseClient(createClient(env.supabaseUrl, env.supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}));
