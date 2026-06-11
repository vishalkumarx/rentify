const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const URL = urlMatch[1].trim();
const KEY = keyMatch[1].trim();

async function testSupabase() {
  console.log('Testing Supabase List API...');
  try {
    const res = await fetch(`${URL}/storage/v1/object/list/item-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'apikey': KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefix: 'chats', limit: 100, offset: 0 })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testSupabase();
