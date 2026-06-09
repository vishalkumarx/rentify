import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { ChevronLeft, Send } from 'lucide-react';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { conversations, messages, sendMessage } = useChat();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find(c => c.id === id);
  const conversationMessages = messages.filter(m => m.conversationId === id);

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages]);

  if (!conversation) {
    return <div style={{ padding: '20px' }}>Conversation not found.</div>;
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(conversation.id, 'me', inputText);
    setInputText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'var(--bg)', animation: 'slideInRight 0.3s ease-out' }}>
      
      {/* Header */}
      <header style={{ height: '64px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)' }}>
        <button onClick={() => navigate(-1)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--text-main)', padding: 0, margin: 0, boxShadow: 'none' }}>
          <ChevronLeft size={24} />
        </button>
        
        <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '20px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>
          {conversation.otherUserName.charAt(0)}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, lineHeight: '20px' }}>{conversation.otherUserName}</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '16px' }}>Online</p>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Product Banner */}
        <div style={{ 
          background: 'var(--surface)', 
          borderRadius: '16px', 
          padding: '12px', 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center',
          marginBottom: '16px',
          border: '1px solid var(--surface-border)'
        }}>
          <img src={conversation.itemImage} alt={conversation.itemTitle} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600 }}>{conversation.itemTitle}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Inquiry about this item</p>
          </div>
        </div>

        {conversationMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '14px' }}>
            Send a message to start the conversation!
          </div>
        ) : (
          conversationMessages.map(msg => {
            const isMe = msg.senderId === 'me';
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  maxWidth: '75%', 
                  padding: '12px 16px', 
                  borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: isMe ? 'var(--primary)' : 'var(--surface)',
                  color: isMe ? '#fff' : 'var(--text-main)',
                  border: isMe ? 'none' : '1px solid var(--surface-border)'
                }}>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.4 }}>{msg.text}</p>
                  <span style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', display: 'block', textAlign: isMe ? 'right' : 'left' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Input */}
      <footer style={{ padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--surface-border)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{ flex: 1, borderRadius: '24px', padding: '12px 20px', border: '1px solid var(--surface-border)', background: 'var(--bg)' }}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '23px', 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: inputText.trim() ? 'var(--primary)' : 'var(--surface-border)',
              color: 'var(--text-main)',
              boxShadow: inputText.trim() ? 'var(--primary-glow)' : 'none'
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}
