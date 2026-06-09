import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

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
  otherUserId: string;
  otherUserName: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: number;
};

type ChatContextType = {
  conversations: Conversation[];
  messages: Message[];
  sendMessage: (conversationId: string, senderId: string, text: string) => void;
  markAsRead: (conversationId: string) => void;
  getOrCreateConversation: (itemId: number, itemTitle: string, itemImage: string, otherUserId: string, otherUserName: string) => string;
};

const initialConversations: Conversation[] = [];

const initialMessages: Message[] = [];

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  messages: [],
  sendMessage: () => {},
  markAsRead: () => {},
  getOrCreateConversation: () => '',
});

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const sendMessage = (conversationId: string, senderId: string, text: string) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      text,
      timestamp: Date.now(),
      status: 'sent',
    };
    
    setMessages(prev => [...prev, newMsg]);
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { 
          ...conv, 
          lastMessage: text, 
          lastMessageTime: newMsg.timestamp,
          unreadCount: senderId !== 'me' ? conv.unreadCount + 1 : conv.unreadCount 
        };
      }
      return conv;
    }));

    // Auto-Reply Simulation
    if (senderId === 'me') {
      // 1. Mark as Delivered after 1s
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
      }, 1000);

      // 2. Mark as Read after 2.5s
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' } : m));
      }, 2500);

      // 3. Send Auto-Reply after 4s
      setTimeout(() => {
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
          sendMessage(conversationId, conv.otherUserId, "Thanks for reaching out! Yes, I can do that.");
        }
      }, 4000);
    }
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    ));
    setMessages(prev => prev.map(msg => 
      (msg.conversationId === conversationId && msg.senderId !== 'me') ? { ...msg, status: 'read' } : msg
    ));
  };

  const getOrCreateConversation = (itemId: number, itemTitle: string, itemImage: string, otherUserId: string, otherUserName: string) => {
    const existing = conversations.find(c => c.itemId === itemId && c.otherUserId === otherUserId);
    if (existing) return existing.id;
    
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      itemId,
      itemTitle,
      itemImage,
      otherUserId,
      otherUserName,
      unreadCount: 0,
    };
    
    setConversations(prev => [newConv, ...prev]);
    return newConv.id;
  };

  return (
    <ChatContext.Provider value={{ conversations, messages, sendMessage, markAsRead, getOrCreateConversation }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
