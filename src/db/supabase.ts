import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// Create a proxy to handle missing credentials gracefully
// This prevents the app from crashing on startup if env vars are missing
const clientCache: { client: any } = { client: null };

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    // If credentials exist, create the real client once and cache it
    if (supabaseUrl && supabaseKey) {
      if (!clientCache.client) {
        clientCache.client = createClient(supabaseUrl, supabaseKey);
      }
      return clientCache.client[prop];
    }

    // If credentials are missing, throw a descriptive error when accessed
    throw new Error(
      'Supabase not initialized. Missing SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }
});
