import { createContext, useContext, useState, ReactNode } from 'react';

export type RentalItem = {
  id: number;
  title: string;
  price: string;
  department: string;
  category: string;
  liked: boolean;
  image: string; // Cover image
  images?: string[]; // Additional images
  userId?: string;
};

type FeedContextType = {
  items: RentalItem[];
  addPost: (item: Omit<RentalItem, 'id' | 'liked'>) => void;
  toggleLike: (id: number) => void;
};

const initialItems: RentalItem[] = [
  { id: 1, title: 'MacBook Pro M2', price: '400', category: 'Electronics', department: 'Computer Science', liked: false, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: 'Sony A7III Camera', price: '350', category: 'Electronics', department: 'Mass Communication', liked: true, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400' },
  { id: 3, title: 'Electric Scooter', price: '150', category: 'Mobility', department: 'Mechanical Engineering', liked: false, image: 'https://images.unsplash.com/photo-1593805342412-2c5e5233bc54?auto=format&fit=crop&q=80&w=400' },
];

const FeedContext = createContext<FeedContextType>({
  items: [],
  addPost: () => {},
  toggleLike: () => {},
});

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<RentalItem[]>(initialItems);

  const addPost = (newItem: Omit<RentalItem, 'id' | 'liked'>) => {
    const post: RentalItem = {
      ...newItem,
      id: Date.now(), // Generate a unique ID
      liked: false,
    };
    // Add to the top of the feed
    setItems((prev) => [post, ...prev]);
  };

  const toggleLike = (id: number) => {
    setItems((prev) => prev.map(item => item.id === id ? { ...item, liked: !item.liked } : item));
  };

  return (
    <FeedContext.Provider value={{ items, addPost, toggleLike }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => useContext(FeedContext);
