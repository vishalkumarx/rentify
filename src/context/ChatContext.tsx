import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  imageUrl?: string;
  location?: { lat: number; lng: number; address: string };
  replyToId?: string;
  isDeleted?: boolean;
};

export type Conversation = {
  id: string;
  itemId: number;
  itemTitle: string;
  itemImage: string;
  participants: Record<string, string>; // { userId: "User Name" }
  lastMessage?: string;
  lastMessageTime?: number;
  messages: Message[];
  unreadCounts: Record<string, number>; // { userId: 0 }
  deletedBy?: string[];
};

// UI Representation
export type UIConversation = {
  id: string;
  itemId: number;
  itemTitle: string;
  itemImage: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage?: string;
  lastMessageTime?: number;
  lastSenderId?: string;
  unreadCount: number;
};

type ChatContextType = {
  conversations: UIConversation[];
  messages: Message[];
  sendMessage: (conversationId: string, senderId: string, text: string, options?: { imageUrl?: string; location?: { lat: number; lng: number; address: string }; replyToId?: string }) => Promise<void>;
  unsendMessage: (conversationId: string, messageId: string) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  getOrCreateConversation: (itemId: number, itemTitle: string, itemImage: string, otherUserId: string, otherUserName: string) => string;
  deleteConversation: (conversationId: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  messages: [],
  sendMessage: async () => {},
  unsendMessage: async () => {},
  markAsRead: () => {},
  getOrCreateConversation: () => '',
  deleteConversation: async () => {},
});

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // 1. Fetch Conversations from Storage
  const fetchChats = useCallback(async () => {
    if (!session?.user?.id) return;
    const myId = session.user.id;

    try {
      const { data: chatFiles, error: listError } = await supabase.storage.from('item-images').list('reviews');
      console.log('[DEBUG] list(reviews) returned:', chatFiles, 'error:', listError);
      if (!chatFiles) return;

      // Filter files that contain my user ID in the name AND start with chat-
      const myChatFiles = chatFiles.filter(f => f.name.startsWith('chat-') && f.name.includes(myId));
      console.log('[DEBUG] myChatFiles after filtering:', myChatFiles.map(f => f.name));
      
      const loadedChats = await Promise.all(
        myChatFiles.map(async f => {
          const chatData = await getStorageJson(`reviews/${f.name}`);
          if (chatData && chatData.deletedBy && chatData.deletedBy.includes(myId)) return null;
          if (chatData && chatData.messages) {
            let needsSave = false;
            chatData.messages.forEach((m: Message) => {
              // If we just downloaded this and see a 'sent' message from the other person, mark it delivered
              if (m.senderId !== myId && m.status === 'sent') {
                m.status = 'delivered';
                needsSave = true;
              }
            });
            if (needsSave) {
              // Fire and forget upload to tell the sender it was delivered to our device
              setStorageJson(`reviews/${f.name}`, chatData).catch(console.error);
            }
          }
          return chatData as Conversation;
        })
      );

      const validChats = (loadedChats.filter(c => c !== null) as Conversation[]).sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      console.log('[DEBUG] validChats count:', validChats.length);

      // Convert to UI Conversations
      const uiConvs = validChats.map(c => {
        const participants = c.participants || {};
        const otherUserId = Object.keys(participants).find(id => id !== myId) || myId;
        const otherUserName = participants[otherUserId] || 'Unknown User';
        
        // Find last sender
        const lastMsg = c.messages?.[c.messages.length - 1];
        
        // Fallback for older chats that didn't store itemId
        const fallbackItemId = c.id && !isNaN(Number(c.id.split('-')[1])) ? Number(c.id.split('-')[1]) : 0;
        
        return {
          id: c.id,
          itemId: c.itemId || fallbackItemId,
          itemTitle: c.itemTitle || 'Item',
          itemImage: c.itemImage || '',
          otherUserId,
          otherUserName,
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime,
          lastSenderId: lastMsg?.senderId,
          unreadCount: c.unreadCounts?.[myId] || 0
        };
      });

      setConversations(prev => {
        // Keep optimistic conversations that haven't appeared in storage list yet
        const existingOptimistic = prev.filter(p => !uiConvs.find(u => u.id === p.id));
        return [...existingOptimistic, ...uiConvs].sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      });

      // Flatten messages for the UI
      const allMessages = validChats.flatMap(c => c.messages || []).sort((a, b) => a.timestamp - b.timestamp);
      
      setMessages(prev => {
        // Keep optimistic messages that haven't appeared in storage list yet
        const existingOptimistic = prev.filter(p => !allMessages.find(m => m.id === p.id));
        return [...allMessages, ...existingOptimistic].sort((a, b) => a.timestamp - b.timestamp);
      });
      
    } catch (err) {
      console.error("Error fetching chats", err);
    }
  }, [session?.user?.id]);

  // Polling every 3 seconds for real-time sync
  useEffect(() => {
    if (!session?.user?.id) return;
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [session?.user?.id, fetchChats]);

  const sendMessage = useCallback(async (conversationId: string, senderId: string, text: string, options?: { imageUrl?: string; location?: { lat: number; lng: number; address: string }; replyToId?: string }) => {
    if (!session?.user?.id) return;
    const myId = session.user.id;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      text,
      timestamp: Date.now(),
      status: 'sent',
      imageUrl: options?.imageUrl,
      location: options?.location,
      replyToId: options?.replyToId
    };
    
    // Optimistic UI Update
    setMessages(prev => [...prev, newMsg]);

    // Update in Storage
    try {
      const chatPath = `reviews/${conversationId}.json`;
      let chatData = await getStorageJson(chatPath) as Conversation;
      
      if (!chatData) {
        // Fallback: reconstruct from UI state if the file wasn't created in time
        const uiConv = conversations.find(c => c.id === conversationId);
        if (!uiConv) {
          console.error("Conversation not found in UI state either");
          return;
        }
        chatData = {
          id: conversationId,
          itemId: uiConv.itemId,
          itemTitle: uiConv.itemTitle,
          itemImage: uiConv.itemImage,
          participants: {
            [myId]: session.user.user_metadata?.full_name || 'Me',
            [uiConv.otherUserId]: uiConv.otherUserName
          },
          messages: [],
          unreadCounts: {
            [myId]: 0,
            [uiConv.otherUserId]: 0
          }
        };
      }

      chatData.messages = [...(chatData.messages || []), newMsg];
      chatData.lastMessage = text;
      chatData.lastMessageTime = newMsg.timestamp;
      
      // Increment unread count for everyone except sender
      if (!chatData.unreadCounts) chatData.unreadCounts = {};
      const otherUserIds = Object.keys(chatData.participants || {}).filter(id => id !== myId);
      otherUserIds.forEach(id => {
        chatData.unreadCounts[id] = (chatData.unreadCounts[id] || 0) + 1;
      });

      await setStorageJson(chatPath, chatData);
      
      // Trigger a re-fetch to sync state properly
      fetchChats();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  }, [session?.user?.id, conversations, fetchChats]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!session?.user?.id) return;
    const myId = session.user.id;

    try {
      const chatPath = `reviews/${conversationId}.json`;
      let chatData = await getStorageJson(chatPath) as Conversation;
      if (!chatData) return;

      let needsSave = false;

      if (!chatData.unreadCounts) chatData.unreadCounts = {};
      if (chatData.unreadCounts[myId] > 0) {
        chatData.unreadCounts[myId] = 0;
        needsSave = true;
      }

      if (chatData.messages) {
        chatData.messages.forEach((m: Message) => {
          if (m.senderId !== myId && m.status !== 'read') {
            m.status = 'read';
            needsSave = true;
          }
        });
      }

      if (needsSave) {
        await setStorageJson(chatPath, chatData);
        fetchChats();
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }, [session?.user?.id, fetchChats]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!session?.user?.id) return;
    const myId = session.user.id;

    // Optimistically remove from UI
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    setMessages(prev => prev.filter(m => m.conversationId !== conversationId));

    try {
      const chatPath = `reviews/${conversationId}.json`;
      const chatData = await getStorageJson(chatPath) as Conversation;
      if (!chatData) return;

      if (!chatData.deletedBy) chatData.deletedBy = [];
      if (!chatData.deletedBy.includes(myId)) {
        chatData.deletedBy.push(myId);
      }
      
      const participants = Object.keys(chatData.participants || {});
      if (chatData.deletedBy.length >= participants.length) {
        await supabase.storage.from('item-images').remove([chatPath]);
      } else {
        await setStorageJson(chatPath, chatData);
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  }, [session?.user?.id]);

  const unsendMessage = useCallback(async (conversationId: string, messageId: string) => {
    if (!session?.user?.id) return;
    const myId = session.user.id;

    // Optimistic Update
    setMessages(prev => {
      const msgs = [...prev];
      const idx = msgs.findIndex(m => m.id === messageId && m.senderId === myId);
      if (idx !== -1) {
        msgs[idx].isDeleted = true;
        msgs[idx].text = "This message was deleted";
        msgs[idx].imageUrl = undefined;
        msgs[idx].location = undefined;
      }
      return msgs;
    });

    try {
      const chatPath = `reviews/${conversationId}.json`;
      const chatData = await getStorageJson(chatPath) as Conversation;
      if (!chatData || !chatData.messages) return;

      const idx = chatData.messages.findIndex(m => m.id === messageId && m.senderId === myId);
      if (idx !== -1) {
        chatData.messages[idx].isDeleted = true;
        chatData.messages[idx].text = "This message was deleted";
        chatData.messages[idx].imageUrl = undefined;
        chatData.messages[idx].location = undefined;
        
        if (idx === chatData.messages.length - 1) {
          chatData.lastMessage = "This message was deleted";
        }
        
        await setStorageJson(chatPath, chatData);
        fetchChats();
      }
    } catch (err) {
      console.error("Failed to unsend message", err);
    }
  }, [session?.user?.id, fetchChats]);

  const getOrCreateConversation = useCallback((itemId: number, itemTitle: string, itemImage: string, otherUserId: string, otherUserName: string) => {
    if (!session?.user?.id) return '';
    const myId = session.user.id;
    const myName = session.user.user_metadata?.full_name || 'Me';

    // Deterministic ID so both users route to the same file
    const sortedIds = [myId, otherUserId].sort();
    const convId = `chat-${itemId}-${sortedIds[0]}-${sortedIds[1]}`;

    // Initialize in background if it doesn't exist
    const initializeChat = async () => {
      // Optimistic UI insertion to prevent "Conversation not found" delay
      setConversations(prev => {
        if (prev.find(c => c.id === convId)) return prev;
        return [{
          id: convId,
          itemId,
          itemTitle,
          itemImage,
          otherUserId,
          otherUserName,
          unreadCount: 0
        }, ...prev];
      });

      const chatPath = `reviews/${convId}.json`;
      const existing = await getStorageJson(chatPath);
      
      if (!existing) {
        const newChat: Conversation = {
          id: convId,
          itemId,
          itemTitle,
          itemImage,
          participants: {
            [myId]: myName,
            [otherUserId]: otherUserName
          },
          messages: [],
          unreadCounts: {
            [myId]: 0,
            [otherUserId]: 0
          }
        };
        await setStorageJson(chatPath, newChat);
        fetchChats();
      }
    };

    initializeChat();
    return convId;
  }, [session?.user?.id, fetchChats]);

  return (
    <ChatContext.Provider value={{
      conversations,
      messages,
      sendMessage,
      unsendMessage,
      markAsRead,
      getOrCreateConversation,
      deleteConversation
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
