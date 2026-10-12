
import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://gfryyeaqrvlopinsyawj.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_th9BO3WxorZDIqMjaZ8CHA_NCxGi18G';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
