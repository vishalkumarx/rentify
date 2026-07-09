import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets.map(b => b.name));

  const { data: reviews } = await supabase.storage.from('item-images').list('reviews');
  console.log('Reviews in item-images/reviews:', reviews?.map(f => f.name).slice(0, 5));
  
  const { data: itemReviews } = await supabase.storage.from('item-images').list('item_reviews');
  console.log('Item reviews in item-images/item_reviews:', itemReviews?.map(f => f.name).slice(0, 5));
}
check();
