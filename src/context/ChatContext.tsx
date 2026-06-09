import { createContext, useContext, useState, ReactNode } from 'react';

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: number;
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
};

type ChatContextType = {
  conversations: Conversation[];
  messages: Message[];
  sendMessage: (conversationId: string, senderId: string, text: string) => void;
  getOrCreateConversation: (itemId: number, itemTitle: string, itemImage: string, otherUserId: string, otherUserName: string) => string;
};

const initialConversations: Conversation[] = [
  {
    id: 'conv-1',
    itemId: 1,
    itemTitle: 'MacBook Pro M2',
    itemImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400',
    otherUserId: 'user-2',
    otherUserName: 'Alex (Owner)',
    lastMessage: 'Is it still available for this weekend?',
    lastMessageTime: Date.now() - 3600000,
  }
];

const initialMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'me',
    text: 'Is it still available for this weekend?',
    timestamp: Date.now() - 3600000,
  }
];

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  messages: [],
  sendMessage: () => {},
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
    };
    
    setMessages(prev => [...prev, newMsg]);
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, lastMessage: text, lastMessageTime: newMsg.timestamp };
      }
      return conv;
    }));
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
    };
    
    setConversations(prev => [newConv, ...prev]);
    return newConv.id;
  };

  return (
    <ChatContext.Provider value={{ conversations, messages, sendMessage, getOrCreateConversation }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
