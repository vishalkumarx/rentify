const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const URL = urlMatch[1].trim();
const KEY = keyMatch[1].trim();

async function uploadChat() {
  const chatData = {
    id: 'chat-1-user1-user2',
    itemId: 1,
    itemTitle: 'Test Item',
    itemImage: 'test.jpg',
    participants: {
      'user1': 'User One',
      'user2': 'User Two'
    },
    messages: [
      { id: 'msg-1', conversationId: 'chat-1-user1-user2', senderId: 'user1', text: 'Hello!', timestamp: Date.now(), status: 'sent' }
    ],
    unreadCounts: { 'user1': 0, 'user2': 1 },
    lastMessage: 'Hello!',
    lastMessageTime: Date.now()
  };

  console.log('Uploading chat...');
  const res = await fetch(`${URL}/storage/v1/object/item-images/chats/chat-1-user1-user2.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'apikey': KEY,
      'Content-Type': 'application/json',
      'x-upsert': 'true'
    },
    body: JSON.stringify(chatData)
  });
  const data = await res.json();
  console.log('Upload status:', res.status, data);
}

async function listChats() {
  console.log('Listing chats...');
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
  console.log('List status:', res.status);
  console.log('Files:', data.map(f => f.name));
}

async function run() {
  await uploadChat();
  await listChats();
}

run();
