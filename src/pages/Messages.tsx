import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { MessageCircle } from 'lucide-react';

export default function Messages() {
  const { conversations } = useChat();
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-slide-in">
      <h1 style={{ fontSize: '28px', margin: 0 }}>Messages</h1>
      
      {conversations.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
          <MessageCircle size={48} opacity={0.5} style={{ marginBottom: '16px' }} />
          <p style={{ margin: 0 }}>No messages yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="glass-panel" 
              style={{ 
                padding: '16px', 
                display: 'flex', 
                gap: '16px', 
                alignItems: 'center',
                cursor: 'pointer' 
              }}
            >
              <img 
                src={conv.itemImage} 
                alt={conv.itemTitle} 
                style={{ width: '56px', height: '56px', borderRadius: '28px', objectFit: 'cover' }} 
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{conv.itemTitle}</h3>
                  {conv.lastMessageTime && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: conv.unreadCount > 0 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: conv.unreadCount > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ fontWeight: 600, marginRight: '4px' }}>
                      {conv.lastSenderId === session?.user?.id ? 'You' : conv.otherUserName}:
                    </span> 
                    {conv.lastMessage || 'Sent a new message'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span style={{ background: 'var(--danger)', color: 'white', fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', marginLeft: '8px' }}>
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
