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
  unreadCount: number;
};

type ChatContextType = {
  conversations: UIConversation[];
  messages: Message[];
  sendMessage: (conversationId: string, senderId: string, text: string) => void;
  markAsRead: (conversationId: string) => void;
  getOrCreateConversation: (itemId: number, itemTitle: string, itemImage: string, otherUserId: string, otherUserName: string) => string;
};

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  messages: [],
  sendMessage: () => {},
  markAsRead: () => {},
  getOrCreateConversation: () => '',
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
      const { data: chatFiles } = await supabase.storage.from('item-images').list('chats');
      if (!chatFiles) return;

      // Filter files that contain my user ID in the name
      const myChatFiles = chatFiles.filter(f => f.name.includes(myId));
      
      const loadedChats = await Promise.all(
        myChatFiles.map(async f => {
          const chatData = await getStorageJson(`chats/${f.name}`);
          return chatData as Conversation;
        })
      );

      const validChats = loadedChats.filter(Boolean).sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

      // Convert to UI Conversations
      const uiConvs = validChats.map(c => {
        const otherUserId = Object.keys(c.participants).find(id => id !== myId) || myId;
        const otherUserName = c.participants[otherUserId] || 'Unknown User';
        return {
          id: c.id,
          itemId: c.itemId,
          itemTitle: c.itemTitle,
          itemImage: c.itemImage,
          otherUserId,
          otherUserName,
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime,
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

  const sendMessage = async (conversationId: string, senderId: string, text: string) => {
    if (!session?.user?.id) return;
    const myId = session.user.id;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      text,
      timestamp: Date.now(),
      status: 'sent',
    };
    
    // Optimistic UI Update
    setMessages(prev => [...prev, newMsg]);

    // Update in Storage
    try {
      const chatPath = `chats/${conversationId}.json`;
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
  };

  const markAsRead = async (conversationId: string) => {
    if (!session?.user?.id) return;
    const myId = session.user.id;

    try {
      const chatPath = `chats/${conversationId}.json`;
      let chatData = await getStorageJson(chatPath) as Conversation;
      if (!chatData) return;

      if (!chatData.unreadCounts) chatData.unreadCounts = {};
      if (chatData.unreadCounts[myId] === 0) return; // Already read

      chatData.unreadCounts[myId] = 0;
      await setStorageJson(chatPath, chatData);
      fetchChats();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const getOrCreateConversation = (itemId: number, itemTitle: string, itemImage: string, otherUserId: string, otherUserName: string) => {
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

      const chatPath = `chats/${convId}.json`;
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
  };

  return (
    <ChatContext.Provider value={{ conversations, messages, sendMessage, markAsRead, getOrCreateConversation }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
