import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ctweiphtosawbraflzat.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'sb_publishable_EXfo6mq_RHDZdVDB7QybUw_yyDaTCAC';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) {
    console.warn('Warning: Using hardcoded Supabase key. This is not recommended for production.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
