import { createClient } from '@supabase/supabase-js';

// Fallback credentials (restored from previous configuration)
// Note: It is highly recommended to use Environment Variables in production.
const DEFAULT_SUPABASE_URL = 'https://ctweiphtosawbraflzat.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_EXfo6mq_RHDZdVDB7QybUw_yyDaTCAC';

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || DEFAULT_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. App may not function correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
