require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: requests } = await supabase.from('booking_requests').select('*').eq('status', 'accepted');
  if (requests) {
    for (const req of requests) {
      await supabase.from('rental_items').update({ status: 'booked' }).eq('id', req.item_id);
      console.log(`Updated item ${req.item_id} to booked`);
    }
  }
}
run();
