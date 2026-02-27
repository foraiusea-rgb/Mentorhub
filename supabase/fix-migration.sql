-- ============================================
-- MentorHub Fix Migration
-- Run this in Supabase SQL Editor
-- Safe to re-run (all idempotent)
-- ============================================

-- 1. Add missing columns to meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_mode meeting_mode DEFAULT 'online';

-- Make start_time nullable (meetings can be created without a fixed time)
ALTER TABLE meetings ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE meetings ALTER COLUMN end_time DROP NOT NULL;

-- Drop the time check constraint if it exists (optional meetings don't need fixed times)
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS valid_meeting_time;

-- 2. Add missing columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_id UUID REFERENCES meeting_slots(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Backfill mentor_id from meetings for existing bookings
UPDATE bookings b SET mentor_id = m.mentor_id
FROM meetings m WHERE b.meeting_id = m.id AND b.mentor_id IS NULL;

-- Make mentor_id NOT NULL after backfill
-- (Only do this if all rows now have mentor_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE mentor_id IS NULL) THEN
    ALTER TABLE bookings ALTER COLUMN mentor_id SET NOT NULL;
  END IF;
END $$;

-- 3. Create missing tables
CREATE TABLE IF NOT EXISTS meeting_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  spots_available INTEGER DEFAULT 1,
  spots_taken INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_id TEXT NOT NULL UNIQUE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add onboarding_completed to profiles if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals TEXT DEFAULT '';

-- 5. Indexes (all FK columns per Supabase best practice)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_expertise ON profiles USING GIN(expertise_tags);
CREATE INDEX IF NOT EXISTS idx_availability_mentor ON availability_slots(mentor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_mentor ON meetings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_is_active ON meetings(is_active);
CREATE INDEX IF NOT EXISTS idx_meeting_slots_meeting ON meeting_slots(meeting_id);
CREATE INDEX IF NOT EXISTS idx_bookings_meeting ON bookings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentee ON bookings(mentee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor ON bookings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_mentor ON payments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_mentor ON reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_share_links_share_id ON share_links(share_id);
CREATE INDEX IF NOT EXISTS idx_share_links_mentor ON share_links(mentor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- 6. RLS for new tables (optimized: (select auth.uid()) for performance)
ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read meeting slots" ON meeting_slots;
CREATE POLICY "Anyone can read meeting slots" ON meeting_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Mentors manage own meeting slots" ON meeting_slots;
CREATE POLICY "Mentors manage own meeting slots" ON meeting_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_slots.meeting_id AND meetings.mentor_id = (select auth.uid()))
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active share links" ON share_links;
CREATE POLICY "Anyone can read active share links" ON share_links FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Mentors manage own share links" ON share_links;
CREATE POLICY "Mentors manage own share links" ON share_links FOR ALL USING ((select auth.uid()) = mentor_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING ((select auth.uid()) = user_id);

-- 7. Fix RLS on existing tables (use (select auth.uid()) for performance)
DROP POLICY IF EXISTS "Public profiles readable" ON profiles;
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Bookings: add mentor policy
DROP POLICY IF EXISTS "Users can read own bookings as mentor" ON bookings;
CREATE POLICY "Users can read own bookings as mentor" ON bookings FOR SELECT USING ((select auth.uid()) = mentor_id);

-- 8. Fix trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mentee')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
