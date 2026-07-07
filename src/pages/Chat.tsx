import { useState, useRef, useEffect, Fragment, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { ChevronLeft, Send, ShieldAlert, Check, CheckCheck, Paperclip, Image as ImageIcon, MapPin, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { useBookings } from '../context/BookingContext';
import { Ban, Lock } from 'lucide-react';
import chatBg from '../assets/chat-bg.png';
import { format, isToday, isYesterday } from 'date-fns';
import { supabase, getStorageJson } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { items } = useFeed();
  const { requests, updateRequestStatus } = useBookings();
  const { conversations, messages, sendMessage, unsendMessage, markAsRead } = useChat();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ messageId: string, x: number, y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const [swipeTargetId, setSwipeTargetId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const [customPrice, setCustomPrice] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [visibleCount, setVisibleCount] = useState(20);

  const conversation = conversations.find(c => c.id === id);
  const allConversationMessages = useMemo(() => {
    return messages.filter(m => m.conversationId === id).sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, id]);

  const conversationMessages = useMemo(() => {
    return allConversationMessages.slice(-visibleCount);
  }, [allConversationMessages, visibleCount]);
  
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

  const isItemDeleted = conversation && !item && !bookingReq && !conversation?.itemId?.toString().startsWith('req-');

  const hasAcceptedBooking = bookingReq?.status === 'accepted';
  const isRequestChat = conversation?.itemId?.toString().startsWith('req-');

  const ownerId = item?.userId || bookingReq?.owner_id;
  const hasOwnerMessage = allConversationMessages.some(m => m.senderId === ownerId);

  const isChatUnlocked = hasAcceptedBooking || hasOwnerMessage || isRequestChat;
  const [isNeedDeleted, setIsNeedDeleted] = useState(false);

  const isChatDisabled = isItemDeleted || (!isOwner && !isChatUnlocked) || isNeedDeleted;

  const lastMessageId = allConversationMessages.length > 0 ? allConversationMessages[allConversationMessages.length - 1].id : null;

  const [needRequest, setNeedRequest] = useState<any>(null);

  useEffect(() => {
    if (isRequestChat && conversation) {
      const requestId = conversation.itemId.toString().replace('req-', '');
      getStorageJson('feed/item_requests.json').then((reqs: any[]) => {
        if (reqs) {
          const req = reqs.find(r => r.id === requestId);
          if (req) {
            setNeedRequest(req);
            setIsNeedDeleted(false);
          } else {
            setIsNeedDeleted(true);
          }
        }
      });
    }
  }, [isRequestChat, conversation?.itemId]);

  useEffect(() => {
    // Scroll to bottom on new message or initial load
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lastMessageId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 0 && visibleCount < allConversationMessages.length) {
      const oldScrollHeight = target.scrollHeight;
      setVisibleCount(prev => prev + 20);
      
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight - oldScrollHeight;
        }
      });
    }
  };

  useEffect(() => {
    if (bookingReq?.status === 'pending' && customPrice === '') {
      setCustomPrice(bookingReq.total_price.toString());
    }
  }, [bookingReq?.id, bookingReq?.status, bookingReq?.total_price]);

  useEffect(() => {
    if (id) {
      markAsRead(id);
    }
  }, [id, allConversationMessages.length, markAsRead]);

  const handlePointerDown = (e: React.PointerEvent, msg: any) => {
    if (msg.text.startsWith('[Booking Request Note]:') || msg.text.startsWith('[Booking Request]:')) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    // Setup swipe
    swipeStartX.current = x;
    swipeStartY.current = y;
    setSwipeTargetId(msg.id);
    setSwipeOffset(0);

    longPressTimer.current = setTimeout(() => {
      if (!msg.isDeleted && msg.imageUrl && msg.senderId === session?.user?.id) {
        setContextMenu({ messageId: msg.id, x, y });
      }
      swipeStartX.current = null;
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent, msg: any) => {
    if (swipeStartX.current === null || swipeTargetId !== msg.id) return;
    
    const diffX = e.clientX - swipeStartX.current;
    const diffY = e.clientY - swipeStartY.current!;

    // Cancel long press if finger moves more than 10px
    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      
      if (Math.abs(diffX) > Math.abs(diffY)) {
        window.getSelection()?.removeAllRanges();
      }
    }

    // Swipe right to reply
    if (diffX > 0 && Math.abs(diffX) > Math.abs(diffY)) {
      setSwipeOffset(Math.min(diffX * 0.4, 60)); // Max resistance up to 60px
    }
  };

  const handlePointerUpOrLeave = (_e: React.PointerEvent, msg: any) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    if (swipeStartX.current !== null && swipeTargetId === msg.id) {
      if (swipeOffset >= 40 && !msg.isDeleted) {
        setReplyingToMessage(msg);
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    }
    swipeStartX.current = null;
    swipeStartY.current = null;
    setSwipeTargetId(null);
    setSwipeOffset(0);
  };

  if (!conversation) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading conversation...</div>;
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && selectedImages.length === 0) || !session?.user?.id || isUploading) return;
    
    setIsUploading(true);

    try {
      let textToSend = inputText.trim();
      let sentImagesCount = 0;

      if (selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `chat-${Date.now()}-${Math.random()}.${fileExt}`;
          const { error } = await supabase.storage.from('item-images').upload(fileName, file);
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(fileName);
          
          if (i === selectedImages.length - 1 && textToSend) {
            await sendMessage(conversation!.id, session.user.id, textToSend, { imageUrl: publicUrl, replyToId: replyingToMessage?.id });
            textToSend = ''; // Consume text
          } else {
            await sendMessage(conversation!.id, session.user.id, '', { imageUrl: publicUrl, replyToId: replyingToMessage?.id });
          }
          sentImagesCount++;
        }
        setSelectedImages([]);
      }

      if (textToSend) {
        await sendMessage(conversation!.id, session.user.id, textToSend, { replyToId: replyingToMessage?.id });
      }
      
      if (sentImagesCount > 0 || textToSend) {
        setInputText('');
        setReplyingToMessage(null);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };



  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setShowAttachments(false);
    setSelectedImages(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            onClick={() => !isRequestChat && navigate(`/item/${conversation.itemId}`)}
            src={conversation.itemImage}
            alt={conversation.itemTitle}
            style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '20px', objectFit: 'cover', cursor: isRequestChat ? 'default' : 'pointer' }}
          />
        ) : (
          <div 
            onClick={() => !isRequestChat && navigate(`/item/${conversation.itemId}`)}
            style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '20px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 'bold', cursor: isRequestChat ? 'default' : 'pointer' }}
          >
            {isRequestChat ? conversation.otherUserName.charAt(0) : conversation.itemTitle.charAt(0)}
          </div>
        )}
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 
            onClick={() => !isRequestChat && navigate(`/item/${conversation.itemId}`)}
            style={{ margin: 0, fontSize: '16px', fontWeight: 600, lineHeight: '20px', cursor: isRequestChat ? 'default' : 'pointer' }}
          >
            {isRequestChat ? conversation.otherUserName : conversation.itemTitle}
          </h2>
          <div 
            onClick={() => navigate(`/user/${conversation.otherUserId}`)}
            style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
          >
            {isRequestChat ? (
              <>
                <span>Need Request</span>
                {needRequest && <span style={{ opacity: 0.8, fontSize: '12px', marginTop: '2px' }}>{needRequest.department}</span>}
              </>
            ) : (
              <span>{isOwner ? `Chat with ${conversation.otherUserName} • Listed by you` : `Listed by ${conversation.otherUserName}`}</span>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main onScroll={handleScroll} ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundImage: `url(${chatBg})`, backgroundSize: 'contain', backgroundPosition: 'top left', backgroundRepeat: 'repeat', backgroundAttachment: 'fixed' }}>
        
        <div style={{ background: 'var(--surface-border)', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'center', maxWidth: '300px', width: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>Safety Guidelines</strong>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>CampusRent does not mediate transactions and is not liable for items.</li>
              <li>Verify the item's condition and exchange in public locations.</li>
              <li>Never pay in advance or share personal banking details.</li>
              <li>Keep all communication inside the app for protection.</li>
            </ul>
          </div>
        </div>

        {/* Need Request Banner */}
        {needRequest && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--primary)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(244, 196, 48, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <ShieldAlert size={16} />
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Need Request Details</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{needRequest.title}</h3>
            {needRequest.description && <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{needRequest.description}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
              {needRequest.budget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '8px' }}>
                  <strong style={{ opacity: 0.5 }}>Budget:</strong> {needRequest.budget}
                </div>
              )}
              {needRequest.dateRequired && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '8px' }}>
                  <strong style={{ opacity: 0.5 }}>Need by:</strong> {needRequest.dateRequired}
                </div>
              )}
              {needRequest.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '8px' }}>
                  <strong style={{ opacity: 0.5 }}>Location:</strong> {needRequest.location}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deleted Need Banner */}
        {isNeedDeleted && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px',
            color: 'var(--danger)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ban size={16} />
              <span style={{ fontSize: '14px', fontWeight: 700 }}>This Need Request was deleted</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', opacity: 0.8 }}>
              The user has deleted this need request. You can no longer send messages in this chat.
            </p>
          </div>
        )}

        {/* Pending Booking Banner for Owner */}
        {isOwner && bookingReq?.status === 'pending' && (
          <div style={{
            position: 'sticky',
            top: '0',
            zIndex: 20,
            background: 'rgba(34, 197, 94, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--success)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#fff' }}>
              <strong>Pending Request:</strong> The user wants to book this item. Original requested price: ₹{bookingReq.total_price}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
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
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#fff', color: 'var(--success)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              >
                Accept Booking
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to decline this booking request?')) {
                    updateRequestStatus(bookingReq.id, 'rejected');
                  }
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 600, cursor: 'pointer' }}
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
                {msg.text.startsWith('[System]:') ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '16px 0', zIndex: 2 }}>
                      <div style={{ 
                        background: 'rgba(0, 0, 0, 0.03)', 
                        border: '1px solid var(--surface-border)',
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        fontSize: '13px', 
                        color: 'var(--text-main)', 
                        textAlign: 'center',
                        maxWidth: '85%',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.4
                      }}>
                        {msg.text.replace('[System]:', '').trim()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '10px', opacity: 0.7, color: 'var(--text-muted)' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </>

                ) : msg.text.startsWith('[Booking Request]:') ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '16px 0', zIndex: 2 }}>
                      <div style={{ 
                        background: 'rgba(59, 130, 246, 0.05)', 
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        color: 'var(--text-main)', 
                        textAlign: 'center',
                        maxWidth: '85%',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.4
                      }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, opacity: 0.8, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3b82f6' }}>Booking Request</p>
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.4 }}>{msg.text.replace('[Booking Request]:', '').trim()}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '10px', opacity: 0.7, color: 'var(--text-muted)' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </>
                ) : (
                <div style={{ position: 'relative', display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', width: '100%' }}>
                  {/* Reply icon revealed on swipe */}
                  {swipeTargetId === msg.id && swipeOffset > 10 && !msg.isDeleted && (
                    <div style={{
                      position: 'absolute',
                      left: isMe ? 'auto' : `calc(${swipeOffset}px - 40px)`,
                      right: isMe ? `calc(100% - ${swipeOffset}px + 8px)` : 'auto',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      opacity: Math.min(swipeOffset / 40, 1),
                      background: 'var(--surface-border)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      zIndex: 1
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                    </div>
                  )}
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: isMe ? 'flex-end' : 'flex-start', 
                      position: 'relative',
                      transform: swipeTargetId === msg.id ? `translateX(${swipeOffset}px)` : 'translateX(0)',
                      transition: swipeTargetId === msg.id ? 'none' : 'transform 0.2s ease-out',
                      width: '100%',
                      userSelect: swipeTargetId === msg.id ? 'none' : 'auto',
                      WebkitUserSelect: swipeTargetId === msg.id ? 'none' : 'auto',
                      touchAction: 'pan-y',
                      zIndex: 2
                    }}
                    onPointerDown={(e) => handlePointerDown(e, msg)}
                    onPointerMove={(e) => handlePointerMove(e, msg)}
                    onPointerUp={(e) => handlePointerUpOrLeave(e, msg)}
                    onPointerLeave={(e) => handlePointerUpOrLeave(e, msg)}
                    onPointerCancel={(e) => handlePointerUpOrLeave(e, msg)}
                    onContextMenu={e => e.preventDefault()}
                  >
                  <div style={{ 
                  maxWidth: '75%', 
                  padding: isEmojiOnly ? '4px' : '12px 16px', 
                  borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: isEmojiOnly ? 'transparent' : (isMe ? 'var(--primary)' : 'var(--surface)'),
                  color: isMe ? '#111827' : 'var(--text-main)',
                  border: isEmojiOnly ? 'none' : (isMe ? 'none' : '1px solid var(--surface-border)')
                }}>
                  {msg.text.startsWith('[Booking Request Note]:') ? (
                    <>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, opacity: 0.8, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking Note</p>
                      <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.4 }}>"{msg.text.replace('[Booking Request Note]:', '').trim()}"</p>
                    </>
                  ) : msg.isDeleted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isMe ? 'rgba(0,0,0,0.6)' : 'var(--text-muted)', fontStyle: 'italic', fontSize: '14px' }}>
                          <Ban size={14} />
                          <span>This message was deleted</span>
                        </div>
                      ) : (
                        <>
                          {msg.replyToId && (() => {
                            const repliedMsg = allConversationMessages.find(m => m.id === msg.replyToId);
                            if (!repliedMsg) return null;
                            return (
                              <div style={{ background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '8px', marginBottom: '8px', fontSize: '13px', borderLeft: '3px solid var(--primary)' }}>
                                <strong style={{ display: 'block', marginBottom: '4px', color: isMe ? 'inherit' : 'var(--text-main)' }}>{repliedMsg.senderId === session?.user?.id ? 'You' : conversation.otherUserName}</strong>
                                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: isMe ? 'inherit' : 'var(--text-muted)' }}>
                                  {repliedMsg.imageUrl ? 'Photo' : repliedMsg.text}
                                </span>
                              </div>
                            );
                          })()}
                          {msg.imageUrl && (
                            <img 
                              src={msg.imageUrl} 
                              alt="Attachment" 
                              onClick={() => setFullscreenImage(msg.imageUrl!)}
                              style={{ width: '100%', maxWidth: '250px', borderRadius: '12px', marginBottom: msg.text ? '8px' : '0', objectFit: 'cover', cursor: 'zoom-in' }} 
                            />
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
                          {msg.text && !msg.location && (
                            <p style={{ margin: 0, fontSize: isEmojiOnly ? '48px' : '15px', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
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
                </div>
                )}
              </Fragment>
            );
          })}
      </main>

      {/* Context Menu Overlay */}
      {contextMenu && (
        <div 
          onClick={() => setContextMenu(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.2)' }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{ 
              position: 'absolute', 
              top: Math.min(contextMenu.y, window.innerHeight - 150) + 'px', 
              left: Math.min(contextMenu.x, window.innerWidth - 150) + 'px', 
              background: 'var(--surface)', 
              borderRadius: '16px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)', 
              padding: '8px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              minWidth: '150px'
            }}
          >
            {(() => {
              const msg = allConversationMessages.find(m => m.id === contextMenu.messageId);
              if (msg && msg.senderId === session?.user?.id && !msg.isDeleted) {
                return (
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to unsend this message?')) {
                        unsendMessage(conversation.id, msg.id);
                      }
                      setContextMenu(null);
                    }}
                    style={{ background: 'transparent', border: 'none', padding: '12px', textAlign: 'left', fontSize: '15px', fontWeight: 600, color: 'var(--danger)', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Unsend Message
                  </button>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Input */}
      <footer style={{ padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--surface-border)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        
        {replyingToMessage && (
          <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
              <strong style={{ fontSize: '12px', color: 'var(--primary)' }}>Replying to {replyingToMessage.senderId === session?.user?.id ? 'Yourself' : conversation.otherUserName}</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {replyingToMessage.imageUrl ? 'Photo' : replyingToMessage.text}
              </span>
            </div>
            <button type="button" onClick={() => setReplyingToMessage(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {selectedImages.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '8px' }}>
            {selectedImages.map((file, idx) => (
              <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--surface-border)' }} />
                <button 
                  type="button"
                  onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', padding: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative' }}>
            <button 
              type="button"
              onClick={() => setShowAttachments(!showAttachments)}
              disabled={isChatDisabled}
              style={{ width: '46px', height: '46px', borderRadius: '23px', background: 'transparent', border: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <Paperclip size={36} />
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
          <input type="file" ref={fileInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageSelect} />

          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={isItemDeleted ? "Item deleted" : isChatDisabled ? "Chat locked" : "Type a message..."}
            value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}

            disabled={isChatDisabled}
            style={{ 
              flex: 1, 
              borderRadius: '24px', 
              padding: '12px 20px', 
              border: '1px solid var(--surface-border)', 
              background: 'var(--bg)', 
              opacity: isChatDisabled ? 0.5 : 1, 
              minWidth: 0,
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: '16px',
              maxHeight: '120px',
              minHeight: '46px',
              lineHeight: '1.4'
            }}
          />
          <button 
            type="submit" 
            disabled={(!inputText.trim() && selectedImages.length === 0) || isChatDisabled || isUploading}
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '23px', 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: (inputText.trim() || selectedImages.length > 0) && !isChatDisabled && !isUploading ? 'var(--primary)' : 'var(--surface-border)',
              color: 'var(--text-main)',
              boxShadow: (inputText.trim() || selectedImages.length > 0) && !isChatDisabled && !isUploading ? 'var(--primary-glow)' : 'none',
              opacity: isChatDisabled || isUploading ? 0.5 : 1
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

      {/* Fullscreen Image Modal */}
      {fullscreenImage && createPortal(
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            onClick={() => setFullscreenImage(null)}
            style={{ position: 'absolute', top: 'env(safe-area-inset-top, 24px)', right: '24px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '56px', height: '56px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100000, marginTop: '24px' }}
          >
            <X size={32} />
          </button>
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={4}
            centerOnInit
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <img 
                src={fullscreenImage} 
                alt="Fullscreen" 
                style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }} 
                onClick={(e) => e.stopPropagation()}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>,
        document.body
      )}
    </div>
  );
}
