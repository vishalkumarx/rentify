-- Run this in your Supabase SQL Editor

CREATE TABLE booking_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  item_id BIGINT REFERENCES rental_items(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view requests if they are the requester or the owner
CREATE POLICY "Users can view their own requests" 
ON booking_requests FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- Policy: Authenticated users can insert requests (as themselves)
CREATE POLICY "Users can insert requests"
ON booking_requests FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

-- Policy: Users can update requests if they are the owner or requester
CREATE POLICY "Owners and requesters can update requests"
ON booking_requests FOR UPDATE
USING (auth.uid() = owner_id OR auth.uid() = requester_id);
