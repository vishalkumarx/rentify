import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles table:', error ? error.message : data);
  
  const { data: verif, error: verifErr } = await supabase.storage.from('item-images').list('verifications');
  console.log('Verifications:', verifErr ? verifErr.message : verif);
}

check();
