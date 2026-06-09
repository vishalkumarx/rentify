import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type SellerProfile = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  memberSince: string;
  verifications: string[];
};

export type RentalItem = {
  id: number;
  title: string;
  price: string;
  department: string;
  category: string;
  liked: boolean;
  image: string; // Cover image
  images?: string[]; // Additional images
  description?: string;
  userId?: string;
  itemRating?: number;
  itemReviewCount?: number;
  seller?: SellerProfile;
  status?: 'available' | 'booked';
};

type FeedContextType = {
  items: RentalItem[];
  addPost: (item: Omit<RentalItem, 'id' | 'liked'>) => void;
  toggleLike: (id: number) => void;
  toggleBookingStatus: (id: number) => void;
};

const mockSeller1: SellerProfile = {
  id: 'u1', name: 'Sarah Jenkins', rating: 4.9, reviewCount: 42, memberSince: 'Sep 2023', verifications: ['ID Verified', 'University Email Confirmed']
};
const mockSeller2: SellerProfile = {
  id: 'u2', name: 'David Chen', rating: 4.6, reviewCount: 15, memberSince: 'Jan 2024', verifications: ['University Email Confirmed']
};

const initialItems: RentalItem[] = [
  { id: 1, title: 'MacBook Pro M2', price: '400', category: 'Electronics', department: 'Computer Science', liked: false, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400', itemRating: 4.8, itemReviewCount: 12, seller: mockSeller1 },
  { id: 2, title: 'Sony A7III Camera', price: '350', category: 'Electronics', department: 'Mass Communication', liked: true, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400', itemRating: 5.0, itemReviewCount: 8, seller: mockSeller2 },
  { id: 3, title: 'Electric Scooter', price: '150', category: 'Mobility', department: 'Mechanical Engineering', liked: false, image: 'https://images.unsplash.com/photo-1593805342412-2c5e5233bc54?auto=format&fit=crop&q=80&w=400', itemRating: 4.2, itemReviewCount: 5, seller: mockSeller1, status: 'booked' },
];

const FeedContext = createContext<FeedContextType>({
  items: [],
  addPost: () => {},
  toggleLike: () => {},
  toggleBookingStatus: () => {},
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

  const toggleBookingStatus = (id: number) => {
    setItems((prev) => prev.map(item => item.id === id ? { ...item, status: item.status === 'booked' ? 'available' : 'booked' } : item));
  };

  return (
    <FeedContext.Provider value={{ items, addPost, toggleLike, toggleBookingStatus }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => useContext(FeedContext);
