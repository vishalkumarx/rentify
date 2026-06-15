import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { ChevronLeft, Send, ShieldAlert, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { Ban } from 'lucide-react';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { items } = useFeed();
  const { conversations, messages, sendMessage, markAsRead } = useChat();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find(c => c.id === id);
  const conversationMessages = messages.filter(m => m.conversationId === id);
  
  const isItemDeleted = conversation && !items.some(item => item.id === Number(conversation.itemId));

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages.length]);

  useEffect(() => {
    if (id) {
      markAsRead(id);
    }
  }, [id, conversationMessages.length, markAsRead]);

  if (!conversation) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading conversation...</div>;
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !session?.user?.id) return;
    sendMessage(conversation.id, session.user.id, inputText);
    setInputText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: '0 auto', width: '100%', maxWidth: '800px', zIndex: 100, background: 'var(--bg)', animation: 'slideInRight 0.3s ease-out' }}>
      
      {/* Header */}
      <header style={{ height: '64px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)' }}>
        <div onClick={() => navigate(-1)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--text-main)', padding: 0, margin: 0, boxShadow: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </div>
        
        <div 
          onClick={() => navigate(`/user/${conversation.otherUserId}`)}
          style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '20px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {conversation.otherUserName.charAt(0)}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 
            onClick={() => navigate(`/item/${conversation.itemId}`)}
            style={{ margin: 0, fontSize: '16px', fontWeight: 600, lineHeight: '20px', cursor: 'pointer' }}
          >
            {conversation.itemTitle}
          </h2>
          <p 
            onClick={() => navigate(`/user/${conversation.otherUserId}`)}
            style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '16px', cursor: 'pointer' }}
          >
            {conversation.otherUserName}
          </p>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        <div style={{ background: 'var(--surface-border)', padding: '12px', borderRadius: '12px', marginBottom: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <ShieldAlert size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            <strong>Safety Warning:</strong> Vicinity does not mediate transactions and is not responsible or liable for any lost, stolen, or damaged items. Please verify the item's condition before renting and exchange items in safe, public locations.
          </p>
        </div>
        
        {/* Product Banner */}
        <div style={{ 
          background: 'var(--surface)', 
          borderRadius: '16px', 
          padding: '12px', 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center',
          marginBottom: isItemDeleted ? '0px' : '16px',
          border: '1px solid var(--surface-border)'
        }}>
          <img src={conversation.itemImage} alt={conversation.itemTitle} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600 }}>{conversation.itemTitle}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Inquiry about this item</p>
          </div>
        </div>

        {/* Deleted Item Banner */}
        {isItemDeleted && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <Ban size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--danger)', fontWeight: 600 }}>
              This item has been deleted by the owner. Chat operations are disabled.
            </p>
          </div>
        )}

        {/* Safety Warning Banner */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid rgba(255, 193, 7, 0.4)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <ShieldAlert size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--text-main)' }}>Safety Notice:</strong> Never pay in advance or share personal banking details. Keep all communication inside the app for your protection.
          </p>
        </div>

        {conversationMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '14px' }}>
            Send a message to start the conversation!
          </div>
        ) : (
          conversationMessages.map(msg => {
            const isMe = msg.senderId === session?.user?.id;
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {msg.status === 'sent' && <Check size={12} color="rgba(255,255,255,0.7)" />}
                        {msg.status === 'delivered' && <CheckCheck size={12} color="rgba(255,255,255,0.7)" />}
                        {msg.status === 'read' && <CheckCheck size={12} color="#00E5FF" />}
                      </span>
                    )}
                  </div>
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
            placeholder={isItemDeleted ? "Chat disabled" : "Type a message..."}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isItemDeleted}
            style={{ flex: 1, borderRadius: '24px', padding: '12px 20px', border: '1px solid var(--surface-border)', background: 'var(--bg)', opacity: isItemDeleted ? 0.5 : 1 }}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isItemDeleted}
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '23px', 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: inputText.trim() && !isItemDeleted ? 'var(--primary)' : 'var(--surface-border)',
              color: 'var(--text-main)',
              boxShadow: inputText.trim() && !isItemDeleted ? 'var(--primary-glow)' : 'none',
              opacity: isItemDeleted ? 0.5 : 1
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}
