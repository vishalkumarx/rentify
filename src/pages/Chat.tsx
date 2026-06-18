import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { ChevronLeft, Send, ShieldAlert, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { useBookings } from '../context/BookingContext';
import { Ban, Lock } from 'lucide-react';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { items } = useFeed();
  const { requests } = useBookings();
  const { conversations, messages, sendMessage, markAsRead } = useChat();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find(c => c.id === id);
  const conversationMessages = messages.filter(m => m.conversationId === id);
  
  const item = items.find(i => i.id === Number(conversation?.itemId));
  const isOwner = session && item && item.userId === session.user.id;

  const isItemDeleted = conversation && !item;

  const bookingReq = conversation && session ? requests.find(r => 
    r.item_id === Number(conversation.itemId) && 
    ((r.requester_id === session.user.id && r.owner_id === conversation.otherUserId) || 
     (r.owner_id === session.user.id && r.requester_id === conversation.otherUserId))
  ) : null;

  const hasAcceptedBooking = bookingReq?.status === 'accepted';

  const isChatUnlocked = isOwner || hasAcceptedBooking || conversationMessages.length > 0;
  const isChatDisabled = isItemDeleted || !isChatUnlocked;

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
            {isOwner ? `Chat with ${conversation.otherUserName} • Listed by you` : `Listed by ${conversation.otherUserName}`}
          </p>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        <div style={{ background: 'var(--surface-border)', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <ShieldAlert size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-main)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Safety Guidelines</strong>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Vicinity does not mediate transactions and is not liable for items.</li>
              <li>Verify the item's condition and exchange in public locations.</li>
              <li>Never pay in advance or share personal banking details.</li>
              <li>Keep all communication inside the app for protection.</li>
            </ul>
          </div>
        </div>



        {/* Not Accepted Banner */}
        {!isItemDeleted && isChatDisabled && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid var(--warning)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <Lock size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--warning)', fontWeight: 600 }}>
              Chat is locked until the owner initiates or accepts the booking.
            </p>
          </div>
        )}


        {bookingReq?.note && (() => {
          const isMe = bookingReq.requester_id === session?.user?.id;
          return (
            <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                maxWidth: '75%', 
                padding: '12px 16px', 
                borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: isMe ? 'var(--primary)' : 'var(--surface)',
                color: isMe ? '#111827' : 'var(--text-main)',
                border: isMe ? 'none' : '1px solid var(--surface-border)'
              }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, opacity: 0.8, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking Note</p>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.4 }}>"{bookingReq.note}"</p>
              </div>
            </div>
          );
        })()}

        {conversationMessages.length === 0 && !bookingReq?.note && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '14px' }}>
            Send a message to start the conversation!
          </div>
        )}
        
        {conversationMessages.map(msg => {
            const isMe = msg.senderId === session?.user?.id;
            const isEmojiOnly = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u.test(msg.text) && msg.text.trim().length > 0;
            
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  maxWidth: '75%', 
                  padding: isEmojiOnly ? '4px' : '12px 16px', 
                  borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: isEmojiOnly ? 'transparent' : (isMe ? 'var(--primary)' : 'var(--surface)'),
                  color: isMe ? '#111827' : 'var(--text-main)',
                  border: isEmojiOnly ? 'none' : (isMe ? 'none' : '1px solid var(--surface-border)')
                }}>
                  <p style={{ margin: 0, fontSize: isEmojiOnly ? '48px' : '15px', lineHeight: 1.2 }}>{msg.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', opacity: 0.7, color: isEmojiOnly ? 'var(--text-muted)' : 'inherit' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <span style={{ marginLeft: '4px', display: 'flex' }}>
                        {msg.status === 'sent' && <Check size={12} color={isEmojiOnly ? "var(--text-muted)" : "rgba(0,0,0,0.5)"} />}
                        {msg.status === 'delivered' && <CheckCheck size={12} color={isEmojiOnly ? "var(--text-muted)" : "rgba(0,0,0,0.5)"} />}
                        {msg.status === 'read' && <CheckCheck size={12} color="#0055FF" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </main>

      {/* Input */}
      <footer style={{ padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--surface-border)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder={isItemDeleted ? "Item deleted" : isChatDisabled ? "Chat locked" : "Type a message..."}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isChatDisabled}
            style={{ flex: 1, borderRadius: '24px', padding: '12px 20px', border: '1px solid var(--surface-border)', background: 'var(--bg)', opacity: isChatDisabled ? 0.5 : 1 }}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isChatDisabled}
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '23px', 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: inputText.trim() && !isChatDisabled ? 'var(--primary)' : 'var(--surface-border)',
              color: 'var(--text-main)',
              boxShadow: inputText.trim() && !isChatDisabled ? 'var(--primary-glow)' : 'none',
              opacity: isChatDisabled ? 0.5 : 1
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>

      {/* Deleted Item Dialog */}
      {isItemDeleted && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)',
            padding: '24px',
            borderRadius: '24px',
            maxWidth: '320px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: 'var(--card-shadow)',
            border: '1px solid var(--danger)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '32px',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Ban size={32} color="var(--danger)" />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800 }}>Item Deleted</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              This item has been deleted by its owner. All chat operations have been disabled.
            </p>
            <button
              onClick={() => navigate(-1)}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '14px',
                background: 'var(--surface-border)',
                color: 'var(--text-main)',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
