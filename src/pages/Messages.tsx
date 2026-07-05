import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Trash2 } from 'lucide-react';

export default function Messages() {
  const { conversations, deleteConversation } = useChat();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handlePressStart = (convId: string) => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowDeleteConfirm(convId);
    }, 600);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent, convId: string) => {
    if (isLongPress.current) {
      e.preventDefault();
      return;
    }
    navigate(`/chat/${convId}`);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteConversation(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

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
              onClick={(e) => handleClick(e, conv.id)}
              onMouseDown={() => handlePressStart(conv.id)}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={() => handlePressStart(conv.id)}
              onTouchEnd={handlePressEnd}
              className="glass-panel" 
              style={{ 
                padding: '16px', 
                display: 'flex', 
                gap: '16px', 
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-slide-in" style={{ width: '100%', maxWidth: '320px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Delete Chat?</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>This action cannot be undone. You will lose all messages in this conversation.</p>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
