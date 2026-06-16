-- Migration: Create user_sessions table for tracking active logged in devices
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  browser_name TEXT,
  os_name TEXT,
  ip_address TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can do all on own sessions" ON public.user_sessions;

-- RLS Policies
CREATE POLICY "Users can do all on own sessions" ON public.user_sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
