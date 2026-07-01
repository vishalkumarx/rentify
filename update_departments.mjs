import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('rental_items')
    .update({ department: 'Civil Engineering' })
    .neq('department', 'Civil Engineering');
  
  if (error) console.error('Error updating items:', error);
  else console.log('Successfully updated items to Civil Engineering.');
}

run();
