import { createContext, useState, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface BookingRequest {
  id: number;
  item_id: number;
  requester_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price: number;
  note?: string;
  created_at?: string;
  // relations
  item?: any;
  requester?: any;
}

interface BookingContextType {
  requests: BookingRequest[];
  createRequest: (booking: Omit<BookingRequest, 'id' | 'created_at' | 'status'>) => Promise<void>;
  updateRequestStatus: (id: number, status: BookingStatus, agreedPrice?: number, cancelReason?: string) => Promise<void>;
  deleteRequest: (id: number) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType>({
  requests: [],
  createRequest: async () => {},
  updateRequestStatus: async () => {},
  deleteRequest: async () => {},
  refreshRequests: async () => {},
});

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const { session } = useAuth();
  const prevRequestsRef = useRef<BookingRequest[]>([]);

  const refreshRequests = async () => {
    if (!session?.user?.id) return;
    
    const data = await getStorageJson('booking_requests.json');
    if (data && Array.isArray(data)) {
      const userRequests = data.filter(req => req.requester_id === session.user.id || req.owner_id === session.user.id);
      
      if (prevRequestsRef.current.length > 0) {
        userRequests.forEach((req: BookingRequest) => {
          if (req.requester_id === session.user.id) {
            const prev = prevRequestsRef.current.find(r => r.id === req.id);
            if (prev && prev.status === 'pending' && req.status === 'accepted') {
              toast.success(`Your booking request was accepted!`);
            } else if (prev && prev.status === 'pending' && req.status === 'rejected') {
              toast.error(`Your booking request was declined.`);
            }
          }
        });
      }
      prevRequestsRef.current = userRequests;
      setRequests(userRequests);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    refreshRequests();
    const interval = setInterval(refreshRequests, 3000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const createRequest = async (booking: Omit<BookingRequest, 'id' | 'created_at' | 'status'>) => {
    const globalRequests = await getStorageJson('booking_requests.json') || [];
    const newReq: BookingRequest = {
      ...booking,
      id: Date.now(),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    globalRequests.push(newReq);
    await setStorageJson('booking_requests.json', globalRequests);
    await refreshRequests();
  };

  const updateRequestStatus = async (id: number, status: BookingStatus, agreedPrice?: number, cancelReason?: string) => {
    const globalRequests = await getStorageJson('booking_requests.json') || [];
    const index = globalRequests.findIndex((r: BookingRequest) => r.id === id);
    if (index === -1) return;

    globalRequests[index].status = status;
    if (agreedPrice !== undefined) {
      globalRequests[index].total_price = agreedPrice;
    }
    
    if (cancelReason) {
      const existingNote = globalRequests[index].note;
      globalRequests[index].note = existingNote ? `${existingNote}\n\nCancel Reason: ${cancelReason}` : `Cancel Reason: ${cancelReason}`;
    }

    await setStorageJson('booking_requests.json', globalRequests);

    // If accepted, update the rental item's status to booked in the DB
    if (status === 'accepted') {
      await supabase
        .from('rental_items')
        .update({ status: 'booked' })
        .eq('id', globalRequests[index].item_id);
    } else if (status === 'cancelled' || status === 'rejected') {
      await supabase
        .from('rental_items')
        .update({ status: 'available' })
        .eq('id', globalRequests[index].item_id);
    }

    await refreshRequests();
  };

  const deleteRequest = async (id: number) => {
    const globalRequests = await getStorageJson('booking_requests.json') || [];
    const newRequests = globalRequests.filter((r: BookingRequest) => r.id !== id);
    await setStorageJson('booking_requests.json', newRequests);
    await refreshRequests();
  };

  return (
    <BookingContext.Provider value={{ requests, createRequest, updateRequestStatus, deleteRequest, refreshRequests }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => useContext(BookingContext);
