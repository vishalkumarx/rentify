const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const URL = urlMatch[1].trim();
const KEY = keyMatch[1].trim();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function testAll() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'testpassword123';
  
  console.log('Signing up...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (authError) {
    console.error('Signup error:', authError.message);
    return;
  }
  
  console.log('User ID:', authData.user.id);
  
  const chatData = {
    id: 'chat-test',
    messages: []
  };
  
  console.log('Uploading chat...');
  const { data: uploadData, error: uploadError } = await supabase.storage.from('item-images').upload(`chats/chat-${authData.user.id}-test.json`, JSON.stringify(chatData), {
    contentType: 'application/json',
    upsert: true
  });
  
  if (uploadError) {
    console.error('Upload error:', uploadError.message);
  } else {
    console.log('Upload success:', uploadData);
  }
  
  console.log('Listing chats...');
  const { data: listData, error: listError } = await supabase.storage.from('item-images').list('chats');
  
  if (listError) {
    console.error('List error:', listError.message);
  } else {
    console.log('Files:', listData.map(f => f.name));
  }
}

testAll();
