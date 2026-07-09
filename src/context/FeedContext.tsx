import toast from 'react-hot-toast';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { DEPARTMENTS } from '../lib/constants';

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
  securityDeposit?: string; // Optional security money
  userId?: string;
  itemRating?: number;
  itemReviewCount?: number;
  seller?: SellerProfile;
  status?: 'available' | 'booked';
  createdAt?: string;
};

type FeedContextType = {
  items: RentalItem[];
  addPost: (item: Omit<RentalItem, 'id' | 'liked'>) => Promise<void>;
  updatePost: (id: number, updates: Partial<RentalItem>) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  toggleLike: (id: number) => void;
  toggleBookingStatus: (id: number) => void;
  loading: boolean;
};

const initialItems: RentalItem[] = [];

const FeedContext = createContext<FeedContextType>({
  items: [],
  addPost: async () => {},
  updatePost: async () => {},
  deletePost: async () => {},
  toggleLike: () => {},
  toggleBookingStatus: () => {},
  loading: true,
});

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<RentalItem[]>(initialItems);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    // 1. Fetch item reviews to calculate actual product ratings (no dummy ratings)
    let allItemReviews: any[] = [];
    const { data: reviewFiles } = await supabase.storage.from('item-images').list('item_reviews');
    if (reviewFiles && reviewFiles.length > 0) {
      const validFiles = reviewFiles.filter(f => f.name.endsWith('.json'));
      const reviewPromises = validFiles.map(async (f) => {
        const urlData = supabase.storage.from('item-images').getPublicUrl(`item_reviews/${f.name}`);
        if (urlData.data?.publicUrl) {
          try {
            const res = await fetch(`${urlData.data.publicUrl}?t=${Date.now()}`);
            if (res.ok) return await res.json();
          } catch (e) {}
        }
        return null;
      });
      const resolved = await Promise.all(reviewPromises);
      allItemReviews = resolved.filter(r => r != null);
    }

    const { data, error } = await supabase
      .from('rental_items')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching items:', error);
    } else if (data) {
      // Map the DB fields (snake_case) to our RentalItem type (camelCase)
      const mappedItems = data.map((item: any) => {
        let cleanDept = item.department || 'Unknown';
        if (cleanDept.includes('{') || cleanDept.includes('[') || cleanDept === 'Unknown') {
          cleanDept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
        }
        
        // Calculate item rating from database reviews
        const itemReviews = allItemReviews.filter(r => r.itemId === item.id.toString() || r.itemId === item.id);
        let computedRating = undefined;
        let computedReviewCount = 0;
        if (itemReviews.length > 0) {
          const sum = itemReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
          computedRating = Number((sum / itemReviews.length).toFixed(1));
          computedReviewCount = itemReviews.length;
        }

        return {
          ...item,
          department: cleanDept,
          userId: item.user_id,
          createdAt: item.created_at,
          liked: false, // Default local like state
          itemRating: computedRating,
          itemReviewCount: computedReviewCount,
          seller: {
            id: item.user_id,
            name: 'User ' + (item.user_id ? item.user_id.substring(0, 5) : '123'),
            rating: 4.8,
            reviewCount: 0,
            memberSince: new Date().getFullYear().toString(),
            verifications: ['Email Confirmed']
          }
        };
    });
      setItems(mappedItems);
    }
    setLoading(false);
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
          department: newItem.department || 'Unknown',
          image: newItem.image,
          images: newItem.images || [newItem.image],
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
        department: data.department || 'Unknown',
        userId: data.user_id,
        liked: false,
        seller: {
          id: data.user_id,
          name: 'User ' + data.user_id.substring(0, 5),
          rating: 4.8,
          reviewCount: 0,
          memberSince: new Date().getFullYear().toString(),
          verifications: ['Email Confirmed']
        }
      };
      setItems((prev) => [post, ...prev]);
    }
  };

  const updatePost = async (id: number, updates: Partial<RentalItem>) => {
    // Convert camelCase to snake_case for DB
    const dbUpdates: any = { ...updates };
    if (updates.userId) dbUpdates.user_id = updates.userId;
    delete dbUpdates.userId;
    delete dbUpdates.id;
    delete dbUpdates.liked;
    
    const { error } = await supabase
      .from('rental_items')
      .update(dbUpdates)
      .eq('id', id);
      
    if (error) {
      console.error('Error updating post:', error);
      throw error;
    }
    
    setItems((prev) => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deletePost = async (id: number) => {
    const { error, count } = await supabase
      .from('rental_items')
      .delete({ count: 'exact' })
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post: ' + error.message);
      throw error;
    }

    if (count === 0) {
      toast.error('Permission denied. You can only delete items that you posted. (Or item already deleted)');
      return;
    }
    
    // Only remove from local state if it successfully deleted in the DB
    setItems((prev) => prev.filter(item => item.id !== id));
  };

  const toggleLike = (id: number) => {
    setItems((prev) => {
      const isLiking = !prev.find(i => i.id === id)?.liked;
      if (isLiking) {
        toast.success('Added to favourites');
      } else {
        toast.success('Removed from favourites');
      }
      return prev.map(item => item.id === id ? { ...item, liked: !item.liked } : item);
    });
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
    <FeedContext.Provider value={{ items, addPost, updatePost, deletePost, toggleLike, toggleBookingStatus, loading }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => useContext(FeedContext);
