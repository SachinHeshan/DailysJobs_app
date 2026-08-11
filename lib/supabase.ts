import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfojxvaixmgsslznhjas.supabase.co';
const supabaseKey = 'sb_publishable_gZ82j57tqa_TIZScrmT2iw_haZoOvpk';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  },
});
