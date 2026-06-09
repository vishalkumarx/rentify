import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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
  addPost: (item: Omit<RentalItem, 'id' | 'liked'>) => Promise<void>;
  toggleLike: (id: number) => void;
  toggleBookingStatus: (id: number) => void;
};

const initialItems: RentalItem[] = [];

const FeedContext = createContext<FeedContextType>({
  items: [],
  addPost: async () => {},
  toggleLike: () => {},
  toggleBookingStatus: () => {},
});

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<RentalItem[]>(initialItems);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('rental_items')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching items:', error);
    } else if (data) {
      // Map the DB fields (snake_case) to our RentalItem type (camelCase)
      const mappedItems = data.map((item: any) => ({
        ...item,
        userId: item.user_id,
        liked: false, // Default local like state
      }));
      setItems(mappedItems);
    }
  };

  useEffect(() => {
    fetchItems();
    
    // Optional: Set up realtime subscription
    const channel = supabase
      .channel('public:rental_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rental_items' }, () => {
        fetchItems(); // Refetch on any change for simplicity
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addPost = async (newItem: Omit<RentalItem, 'id' | 'liked'>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from('rental_items')
      .insert([
        {
          title: newItem.title,
          price: newItem.price,
          description: newItem.description,
          category: newItem.category,
          department: newItem.department,
          image: newItem.image,
          status: 'available',
          user_id: userData.user.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding post:', error);
      throw error;
    }

    if (data) {
      const post: RentalItem = {
        ...data,
        userId: data.user_id,
        liked: false,
      };
      setItems((prev) => [post, ...prev]);
    }
  };

  const toggleLike = (id: number) => {
    setItems((prev) => prev.map(item => item.id === id ? { ...item, liked: !item.liked } : item));
  };

  const toggleBookingStatus = async (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const newStatus = item.status === 'booked' ? 'available' : 'booked';
    
    // Optimistic UI update
    setItems((prev) => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    
    // Update Supabase
    const { error } = await supabase
      .from('rental_items')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (error) {
      console.error('Error toggling booking status:', error);
      // Revert on error
      setItems((prev) => prev.map(i => i.id === id ? { ...i, status: item.status } : i));
    }
  };

  return (
    <FeedContext.Provider value={{ items, addPost, toggleLike, toggleBookingStatus }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => useContext(FeedContext);
