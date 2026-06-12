import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type BookingStatus = 'pending' | 'accepted' | 'rejected';

export interface BookingRequest {
  id: number;
  item_id: number;
  requester_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price: number;
  created_at?: string;
  // relations
  item?: any;
  requester?: any;
}

interface BookingContextType {
  requests: BookingRequest[];
  createRequest: (booking: Omit<BookingRequest, 'id' | 'created_at' | 'status'>) => Promise<void>;
  updateRequestStatus: (id: number, status: BookingStatus) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType>({
  requests: [],
  createRequest: async () => {},
  updateRequestStatus: async () => {},
  refreshRequests: async () => {},
});

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const { session } = useAuth();

  const refreshRequests = async () => {
    if (!session?.user?.id) return;
    
    // For this prototype, we'll fetch all requests where user is either requester or owner
    // Normally we would use actual DB relationships, but we use string parsing if relationships aren't setup
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .or(`requester_id.eq.${session.user.id},owner_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching bookings (Table might not exist yet in DB):', error);
      // Fallback if table doesn't exist to prevent crash in demo
    } else if (data) {
      setRequests(data);
    }
  };

  useEffect(() => {
    refreshRequests();
  }, [session]);

  const createRequest = async (booking: Omit<BookingRequest, 'id' | 'created_at' | 'status'>) => {
    const { data, error } = await supabase
      .from('booking_requests')
      .insert([
        {
          ...booking,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating booking request:', error);
      // Fallback for prototype if table doesn't exist
      const mockReq: BookingRequest = {
        ...booking,
        id: Math.floor(Math.random() * 10000),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      setRequests(prev => [mockReq, ...prev]);
      alert('Mock Booking Request sent! (Database table missing)');
      return;
    }

    if (data) {
      setRequests(prev => [data, ...prev]);
      alert('Booking Request sent successfully!');
    }
  };

  const updateRequestStatus = async (id: number, status: BookingStatus) => {
    const { error } = await supabase
      .from('booking_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      // Fallback mock
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
      return;
    }

    setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
  };

  return (
    <BookingContext.Provider value={{ requests, createRequest, updateRequestStatus, refreshRequests }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => useContext(BookingContext);
