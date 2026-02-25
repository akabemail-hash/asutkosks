import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ctweiphtosawbraflzat.supabase.co';
const supabaseKey = 'sb_publishable_EXfo6mq_RHDZdVDB7QybUw_yyDaTCAC';

export const supabase = createClient(supabaseUrl, supabaseKey);
