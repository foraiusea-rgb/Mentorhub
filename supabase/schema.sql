-- ============================================
-- MentorHub Database Schema (Fixed)
-- Safe to re-run (all statements are idempotent)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM Types (idempotent)
-- ============================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('mentor', 'mentee', 'both'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE meeting_type AS ENUM ('one_on_one', 'group'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE meeting_mode AS ENUM ('online', 'offline', 'hybrid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE meeting_status AS ENUM ('draft', 'published', 'cancelled', 'completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- Profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'mentee',
  bio TEXT DEFAULT '',
  headline TEXT DEFAULT '',
  expertise_tags TEXT[] DEFAULT '{}',
  credentials JSONB DEFAULT '[]',
  interests TEXT[] DEFAULT '{}',
  goals TEXT DEFAULT '',
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  stripe_account_id TEXT,
  stripe_customer_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Availability Slots (weekly recurring)
-- ============================================
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- ============================================
-- Meetings
-- ============================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  agenda JSONB DEFAULT '[]',
  meeting_type meeting_type NOT NULL DEFAULT 'one_on_one',
  meeting_mode meeting_mode NOT NULL DEFAULT 'online',
  status meeting_status NOT NULL DEFAULT 'draft',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  location_name TEXT,
  location_address TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  meeting_link TEXT,
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_free BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_participants CHECK (current_participants <= max_participants)
);

-- ============================================
-- Meeting Slots
-- ============================================
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

-- ============================================
-- Bookings (now has mentor_id + slot_id)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES meeting_slots(id) ON DELETE SET NULL,
  mentee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guest_name TEXT,
  guest_email TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Payments
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Reviews
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Guest RSVPs
-- ============================================
CREATE TABLE IF NOT EXISTS guest_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('attending', 'maybe', 'declined')),
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI Recommendation Log
-- ============================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recommended_mentor_ids UUID[] DEFAULT '{}',
  reasoning TEXT,
  model_used TEXT DEFAULT 'openrouter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Share Links
-- ============================================
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

-- ============================================
-- Notifications
-- ============================================
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

-- ============================================
-- Indexes (all FK columns per Supabase best practice)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_expertise ON profiles USING GIN(expertise_tags);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_availability_mentor ON availability_slots(mentor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_mentor ON meetings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_slug ON meetings(slug);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
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
CREATE INDEX IF NOT EXISTS idx_guest_rsvps_meeting ON guest_rsvps(meeting_id);
CREATE INDEX IF NOT EXISTS idx_guest_rsvps_token ON guest_rsvps(token);
CREATE INDEX IF NOT EXISTS idx_share_links_share_id ON share_links(share_id);
CREATE INDEX IF NOT EXISTS idx_share_links_mentor ON share_links(mentor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- ============================================
-- RLS (optimized: wrap auth.uid() in select for performance)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles readable" ON profiles;
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read availability" ON availability_slots;
CREATE POLICY "Anyone can read availability" ON availability_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Mentors manage own availability" ON availability_slots;
CREATE POLICY "Mentors manage own availability" ON availability_slots FOR ALL USING ((select auth.uid()) = mentor_id);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active meetings" ON meetings;
CREATE POLICY "Anyone can read active meetings" ON meetings FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Mentors can read own meetings" ON meetings;
CREATE POLICY "Mentors can read own meetings" ON meetings FOR SELECT USING ((select auth.uid()) = mentor_id);
DROP POLICY IF EXISTS "Mentors can insert own meetings" ON meetings;
CREATE POLICY "Mentors can insert own meetings" ON meetings FOR INSERT WITH CHECK ((select auth.uid()) = mentor_id);
DROP POLICY IF EXISTS "Mentors can update own meetings" ON meetings;
CREATE POLICY "Mentors can update own meetings" ON meetings FOR UPDATE USING ((select auth.uid()) = mentor_id);
DROP POLICY IF EXISTS "Mentors can delete own meetings" ON meetings;
CREATE POLICY "Mentors can delete own meetings" ON meetings FOR DELETE USING ((select auth.uid()) = mentor_id);

ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read meeting slots" ON meeting_slots;
CREATE POLICY "Anyone can read meeting slots" ON meeting_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Mentors manage own meeting slots" ON meeting_slots;
CREATE POLICY "Mentors manage own meeting slots" ON meeting_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_slots.meeting_id AND meetings.mentor_id = (select auth.uid()))
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own bookings as mentee" ON bookings;
CREATE POLICY "Users can read own bookings as mentee" ON bookings FOR SELECT USING ((select auth.uid()) = mentee_id);
DROP POLICY IF EXISTS "Users can read own bookings as mentor" ON bookings;
CREATE POLICY "Users can read own bookings as mentor" ON bookings FOR SELECT USING ((select auth.uid()) = mentor_id);
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK ((select auth.uid()) = mentee_id);
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING ((select auth.uid()) = mentee_id OR (select auth.uid()) = mentor_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING ((select auth.uid()) = payer_id OR (select auth.uid()) = mentor_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK ((select auth.uid()) = reviewer_id);

ALTER TABLE guest_rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create RSVP" ON guest_rsvps;
CREATE POLICY "Anyone can create RSVP" ON guest_rsvps FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can read RSVPs" ON guest_rsvps;
CREATE POLICY "Anyone can read RSVPs" ON guest_rsvps FOR SELECT USING (true);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own recommendations" ON ai_recommendations;
CREATE POLICY "Users can read own recommendations" ON ai_recommendations FOR SELECT USING ((select auth.uid()) = mentee_id);

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

-- ============================================
-- Functions & Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS meetings_updated_at ON meetings;
CREATE TRIGGER meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

CREATE OR REPLACE FUNCTION increment_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    UPDATE meetings SET current_participants = current_participants + 1 WHERE id = NEW.meeting_id;
  END IF;
  IF OLD IS NOT NULL AND OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
    UPDATE meetings SET current_participants = GREATEST(current_participants - 1, 0) WHERE id = NEW.meeting_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS booking_participant_count ON bookings;
CREATE TRIGGER booking_participant_count AFTER INSERT OR UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION increment_participants();

CREATE OR REPLACE FUNCTION update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    rating = (SELECT AVG(rating) FROM reviews WHERE mentor_id = NEW.mentor_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE mentor_id = NEW.mentor_id)
  WHERE id = NEW.mentor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS review_rating_update ON reviews;
CREATE TRIGGER review_rating_update AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_mentor_rating();
