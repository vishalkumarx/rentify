import { useState, useRef, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { ChevronLeft, Send, ShieldAlert, Check, CheckCheck, Paperclip, Image as ImageIcon, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { useBookings } from '../context/BookingContext';
import { Ban, Lock } from 'lucide-react';
import chatBg from '../assets/chat-bg.png';
import { format, isToday, isYesterday } from 'date-fns';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { items } = useFeed();
  const { requests, updateRequestStatus } = useBookings();
  const { conversations, messages, sendMessage, markAsRead } = useChat();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [customPrice, setCustomPrice] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations.find(c => c.id === id);
  const conversationMessages = messages.filter(m => m.conversationId === id);
  
  const item = items.find(i => i.id === Number(conversation?.itemId));
  
  const bookingReq = conversation && session ? requests.find(r => 
    r.item_id === Number(conversation.itemId) && 
    ((r.requester_id === session.user.id && r.owner_id === conversation.otherUserId) || 
     (r.owner_id === session.user.id && r.requester_id === conversation.otherUserId))
  ) : null;

  const isOwner = session && (
    (item && item.userId === session.user.id) || 
    (bookingReq && bookingReq.owner_id === session.user.id)
  );

  const isItemDeleted = conversation && !item && !bookingReq;

  const hasAcceptedBooking = bookingReq?.status === 'accepted';

  const ownerId = item?.userId || bookingReq?.owner_id;
  const hasOwnerMessage = conversationMessages.some(m => m.senderId === ownerId);

  const isChatUnlocked = hasAcceptedBooking || hasOwnerMessage;
  const isChatDisabled = isItemDeleted || (!isOwner && !isChatUnlocked);

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages.length]);

  useEffect(() => {
    if (bookingReq?.status === 'pending' && customPrice === '') {
      setCustomPrice(bookingReq.total_price.toString());
    }
  }, [bookingReq?.id, bookingReq?.status, bookingReq?.total_price]);

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



  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setShowAttachments(false);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chat-${Date.now()}-${Math.random()}.${fileExt}`;
      const { error } = await supabase.storage.from('item-images').upload(fileName, file);
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(fileName);
      
      await sendMessage(id!, session?.user?.id!, 'Sent an image', { imageUrl: publicUrl });
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    }
  };

  const handleLocationShare = () => {
    setShowAttachments(false);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    toast.success('Fetching location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendMessage(id!, session?.user?.id!, 'Shared location', { 
          location: { lat: latitude, lng: longitude, address: 'Current Location' } 
        });
      },
      () => {
        toast.error('Unable to retrieve your location');
      }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: '0 auto', width: '100%', maxWidth: '800px', zIndex: 100, background: 'var(--bg)', animation: 'slideInRight 0.3s ease-out' }}>
      
      {/* Header */}
      <header style={{ height: '64px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)' }}>
        <div onClick={() => navigate(-1)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--text-main)', padding: 0, margin: 0, boxShadow: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </div>
        
        {conversation.itemImage ? (
          <img 
            onClick={() => navigate(`/item/${conversation.itemId}`)}
            src={conversation.itemImage}
            alt={conversation.itemTitle}
            style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '20px', objectFit: 'cover', cursor: 'pointer' }}
          />
        ) : (
          <div 
            onClick={() => navigate(`/item/${conversation.itemId}`)}
            style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '20px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {conversation.itemTitle.charAt(0)}
          </div>
        )}
        
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
      <main ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundImage: `url(${chatBg})`, backgroundSize: 'contain', backgroundPosition: 'top left', backgroundRepeat: 'repeat', backgroundAttachment: 'fixed' }}>
        
        <div style={{ background: 'var(--surface-border)', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>Safety Guidelines</strong>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Vicinity does not mediate transactions and is not liable for items.</li>
              <li>Verify the item's condition and exchange in public locations.</li>
              <li>Never pay in advance or share personal banking details.</li>
              <li>Keep all communication inside the app for protection.</li>
            </ul>
          </div>
        </div>

        {/* Pending Booking Banner for Owner */}
        {isOwner && bookingReq?.status === 'pending' && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid var(--success)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)' }}>
              <strong>Pending Request:</strong> The user wants to book this item. Original requested price: ₹{bookingReq.total_price}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Final Accepting Price (₹)
              </label>
              <input
                type="number"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                placeholder="Enter negotiated price"
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--success)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '15px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button 
                onClick={() => {
                  const finalPrice = customPrice ? Number(customPrice) : bookingReq.total_price;
                  updateRequestStatus(bookingReq.id, 'accepted', finalPrice);
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--success)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Accept Booking
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to decline this booking request?')) {
                    updateRequestStatus(bookingReq.id, 'rejected');
                  }
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Decline
              </button>
            </div>
          </div>
        )}


        {/* Not Accepted Banner */}
        {!isItemDeleted && !isChatUnlocked && (
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
              {isOwner ? "Chat is currently locked for the requester. Send a message to unlock it." : "Chat is locked until the owner initiates or accepts the booking."}
            </p>
          </div>
        )}



        {conversationMessages.length === 0 && !bookingReq?.note && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '14px' }}>
            Send a message to start the conversation!
          </div>
        )}
        
        {conversationMessages.map((msg, index) => {
            const isMe = msg.senderId === session?.user?.id;
            const isEmojiOnly = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u.test(msg.text) && msg.text.trim().length > 0;
            
            const msgDate = new Date(msg.timestamp);
            let showDateDivider = false;
            let dateLabel = '';
            
            if (index === 0) {
              showDateDivider = true;
            } else {
              const prevMsgDate = new Date(conversationMessages[index - 1].timestamp);
              if (msgDate.toDateString() !== prevMsgDate.toDateString()) {
                showDateDivider = true;
              }
            }

            if (showDateDivider) {
              if (isToday(msgDate)) {
                dateLabel = 'Today';
              } else if (isYesterday(msgDate)) {
                dateLabel = 'Yesterday';
              } else {
                dateLabel = format(msgDate, 'dd MMMM yyyy');
              }
            }
            
            return (
              <Fragment key={msg.id}>
                {showDateDivider && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 0px', position: 'sticky', top: '10px', zIndex: 10 }}>
                    <span style={{ 
                      background: 'rgba(0,0,0,0.3)', 
                      color: '#fff', 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {dateLabel}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  maxWidth: '75%', 
                  padding: isEmojiOnly ? '4px' : '12px 16px', 
                  borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: isEmojiOnly ? 'transparent' : (isMe ? 'var(--primary)' : 'var(--surface)'),
                  color: isMe ? '#111827' : 'var(--text-main)',
                  border: isEmojiOnly ? 'none' : (isMe ? 'none' : '1px solid var(--surface-border)')
                }}>
                  {msg.text.startsWith('[Booking Request Note]: ') ? (
                    <>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, opacity: 0.8, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking Note</p>
                      <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.4 }}>"{msg.text.replace('[Booking Request Note]: ', '')}"</p>
                    </>
                  ) : msg.text.startsWith('[Booking Request]: ') ? (
                    <>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, opacity: 0.8, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking Request</p>
                      <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.4 }}>{msg.text.replace('[Booking Request]: ', '')}</p>
                    </>
                  ) : (
                    <>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="Attachment" style={{ width: '100%', maxWidth: '250px', borderRadius: '12px', marginBottom: msg.text ? '8px' : '0', objectFit: 'cover' }} />
                      )}
                      {msg.location && (
                        <a href={`https://maps.google.com/?q=${msg.location.lat},${msg.location.lng}`} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: msg.text ? '8px' : '0', textDecoration: 'none' }}>
                          <div style={{ background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                            <div style={{ height: '120px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MapPin size={32} color="var(--primary)" />
                            </div>
                            <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-main)' }}>
                              <strong>{msg.location.address}</strong><br/>
                              <span style={{ color: 'var(--text-muted)' }}>Tap to view on map</span>
                            </div>
                          </div>
                        </a>
                      )}
                      {msg.text && !msg.imageUrl && !msg.location && (
                        <p style={{ margin: 0, fontSize: isEmojiOnly ? '48px' : '15px', lineHeight: 1.2 }}>{msg.text}</p>
                      )}
                    </>
                  )}
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
            </Fragment>
            );
          })}
      </main>

      {/* Input */}
      <footer style={{ padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--surface-border)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button 
              type="button"
              onClick={() => setShowAttachments(!showAttachments)}
              disabled={isChatDisabled}
              style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <Paperclip size={20} />
            </button>
            
            {showAttachments && (
              <div style={{ position: 'absolute', bottom: '50px', left: 0, background: 'var(--surface)', borderRadius: '16px', padding: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 100, width: '150px' }}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-main)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                  <ImageIcon size={18} /> Image
                </button>
                <button type="button" onClick={handleLocationShare} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-main)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                  <MapPin size={18} /> Location
                </button>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />

          <input
            type="text"
            placeholder={isItemDeleted ? "Item deleted" : isChatDisabled ? "Chat locked" : "Type a message..."}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isChatDisabled}
            style={{ flex: 1, borderRadius: '24px', padding: '12px 20px', border: '1px solid var(--surface-border)', background: 'var(--bg)', opacity: isChatDisabled ? 0.5 : 1, minWidth: 0 }}
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
