const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function testAll() {
  const email = `testuser_${Date.now()}@gmail.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: 'testpassword123' });
  if (authError) return console.log('Signup failed:', authError.message);
  const uid = authData.user.id;
  
  const pathsToTest = [
    `chats/${uid}.json`,
    `chats/chat-${uid}.json`,
    `${uid}.json`,
    `${uid}/chat.json`,
    `profiles/${uid}.json`,
    `profiles/${uid}_chat.json`,
    `profiles/chat-${uid}.json`,
    `reviews/${uid}.json`,
    `admin/${uid}.json`
  ];
  
  for (const path of pathsToTest) {
    const { error } = await supabase.storage.from('item-images').upload(path, "{}", { contentType: 'application/json', upsert: false });
    console.log(`Upload to ${path}:`, error ? error.message : 'SUCCESS');
  }
}
testAll();
