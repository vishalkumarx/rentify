import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbpsmzdmqpeeolosjexr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icHNtemRtcXBlZW9sb3NqZXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTE4ODEsImV4cCI6MjA5NjU2Nzg4MX0.YlORN3-fynTuG7OslRPdPGsB1un8OvMFRDr57nZ7xSg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('rental_items').select('*').order('created_at', { ascending: false }).limit(2);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Latest items:', data);
  }
}

test();
