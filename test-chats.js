import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.storage.from('item-images').list('chats');
  console.log('Chats list error:', error ? error.message : null);
  console.log('Chats list data:', data);
}

check();
