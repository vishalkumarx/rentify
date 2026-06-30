import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('booking_requests').select('*');
  console.log("Requests:");
  data.forEach(d => console.log(d.id, d.status, JSON.stringify(d.note)));
}
check();
