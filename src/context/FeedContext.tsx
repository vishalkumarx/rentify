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

const initialItems: RentalItem[] = [];

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
