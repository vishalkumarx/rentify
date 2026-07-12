import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Messages() {
  const { conversations, deleteConversation } = useChat();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleSelectConv = (id: string) => {
    const newSet = new Set(selectedConvIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedConvIds(newSet);
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedConvIds(newSet => { newSet.clear(); return newSet; });
  };

  const handleDeleteSelected = async () => {
    let deletedCount = 0;
    for (const id of selectedConvIds) {
      await deleteConversation(id);
      deletedCount++;
    }
    setShowDeleteConfirm(false);
    exitSelectMode();
    toast.success(`${deletedCount} chat${deletedCount > 1 ? 's' : ''} deleted`);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', minHeight: '100vh' }} className="animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Messages</h1>
        {conversations.length > 0 && (
          isSelectMode ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedConvIds.size === 0}
                style={{ padding: '4px 12px', borderRadius: '16px', border: 'none', background: selectedConvIds.size > 0 ? 'var(--danger)' : 'var(--surface-border)', color: selectedConvIds.size > 0 ? '#fff' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: selectedConvIds.size > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Delete {selectedConvIds.size > 0 ? `(${selectedConvIds.size})` : ''}
              </button>
              <button
                onClick={exitSelectMode}
                style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSelectMode(true)}
              style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Edit
            </button>
          )
        )}
      </div>
      
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
              onClick={() => isSelectMode ? toggleSelectConv(conv.id) : navigate(`/chat/${conv.id}`)}
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
              {isSelectMode && (
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedConvIds.has(conv.id) ? 'var(--primary)' : 'var(--surface-border)'}`,
                  background: selectedConvIds.has(conv.id) ? 'var(--primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  marginRight: '8px'
                }}>
                  {selectedConvIds.has(conv.id) && (
                    <Check size={14} strokeWidth={3} color="#111827" />
                  )}
                </div>
              )}
              {conv.itemImage ? (
                <img 
                  src={conv.itemImage} 
                  alt={conv.itemTitle} 
                  style={{ width: '56px', height: '56px', borderRadius: '28px', objectFit: 'cover', flexShrink: 0 }} 
                />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '28px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '20px', flexShrink: 0 }}>
                  {conv.itemId.toString().startsWith('req-') ? conv.otherUserName.charAt(0) : conv.itemTitle.charAt(0)}
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>
                    {conv.itemId.toString().startsWith('req-') ? conv.otherUserName : conv.itemTitle}
                  </h3>
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

    
      {/* Select mode floating action bar */}
      {isSelectMode && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: '400px',
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          borderRadius: '16px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 100
        }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {selectedConvIds.size} selected
          </span>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={selectedConvIds.size === 0}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              background: selectedConvIds.size === 0 ? 'var(--surface-border)' : 'var(--danger)',
              color: selectedConvIds.size === 0 ? 'var(--text-muted)' : '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: selectedConvIds.size === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <X size={16} />
            Delete {selectedConvIds.size > 0 ? `(${selectedConvIds.size})` : ''}
          </button>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '24px', width: '100%', maxWidth: '340px', border: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Delete Messages</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5, margin: '12px 0 24px' }}>
              Are you sure you want to delete {selectedConvIds.size === 1 ? 'this conversation' : `these ${selectedConvIds.size} conversations`}? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDeleteSelected} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
