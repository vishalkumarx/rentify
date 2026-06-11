const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

async function testAll() {
  const email = `testuser_${Date.now()}@gmail.com`;
  const { data: authData } = await supabase.auth.signUp({ email, password: 'testpassword123' });
  console.log('User ID:', authData.user.id);
  
  console.log('Uploading to ROOT...');
  const { error: rootError } = await supabase.storage.from('item-images').upload(`${authData.user.id}-test.json`, "{}", { contentType: 'application/json' });
  console.log('Root upload error:', rootError ? rootError.message : 'SUCCESS');
  
  console.log('Uploading to VERIFICATIONS...');
  const { error: verifError } = await supabase.storage.from('item-images').upload(`verifications/${authData.user.id}-test.json`, "{}", { contentType: 'application/json' });
  console.log('Verifications upload error:', verifError ? verifError.message : 'SUCCESS');
}
testAll();
