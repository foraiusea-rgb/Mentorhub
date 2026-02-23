-- ============================================
-- MentorHub Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM Types
-- ============================================
CREATE TYPE user_role AS ENUM ('mentor', 'mentee', 'both');
CREATE TYPE meeting_type AS ENUM ('one_on_one', 'group');
CREATE TYPE meeting_mode AS ENUM ('online', 'offline', 'hybrid');
CREATE TYPE meeting_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- ============================================
-- Profiles Table
-- ============================================
CREATE TABLE profiles (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Availability Slots (weekly recurring)
-- ============================================
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- ============================================
-- Meetings
-- ============================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  agenda JSONB DEFAULT '[]',
  meeting_type meeting_type NOT NULL DEFAULT 'one_on_one',
  meeting_mode meeting_mode NOT NULL DEFAULT 'online',
  status meeting_status NOT NULL DEFAULT 'draft',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
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
  tags TEXT[] DEFAULT '{}',
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_meeting_time CHECK (end_time > start_time),
  CONSTRAINT valid_participants CHECK (current_participants <= max_participants)
);

-- ============================================
-- Bookings
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  mentee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Payments
-- ============================================
CREATE TABLE payments (
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
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Guest RSVPs (no account needed)
-- ============================================
CREATE TABLE guest_rsvps (
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
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recommended_mentor_ids UUID[] DEFAULT '{}',
  reasoning TEXT,
  model_used TEXT DEFAULT 'openrouter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_expertise ON profiles USING GIN(expertise_tags);
CREATE INDEX idx_meetings_mentor ON meetings(mentor_id);
CREATE INDEX idx_meetings_slug ON meetings(slug);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_bookings_meeting ON bookings(meeting_id);
CREATE INDEX idx_bookings_mentee ON bookings(mentee_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_availability_mentor ON availability_slots(mentor_id);
CREATE INDEX idx_guest_rsvps_meeting ON guest_rsvps(meeting_id);
CREATE INDEX idx_guest_rsvps_token ON guest_rsvps(token);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Profiles: public read, own write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles readable" ON profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Availability: mentor manages, public reads
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read availability" ON availability_slots
  FOR SELECT USING (true);

CREATE POLICY "Mentors manage own availability" ON availability_slots
  FOR ALL USING (auth.uid() = mentor_id);

-- Meetings: public read published, mentor manages own
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published meetings" ON meetings
  FOR SELECT USING (status = 'published');

CREATE POLICY "Mentors can read own meetings" ON meetings
  FOR SELECT USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can manage own meetings" ON meetings
  FOR INSERT WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update own meetings" ON meetings
  FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete own meetings" ON meetings
  FOR DELETE USING (auth.uid() = mentor_id);

-- Bookings: participants can read their own
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Mentors can read meeting bookings" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = bookings.meeting_id AND meetings.mentor_id = auth.uid())
  );

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = mentee_id);

-- Payments: own access only
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = mentor_id);

-- Reviews: public read, authenticated write
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Guest RSVPs: public write for specific meeting
ALTER TABLE guest_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create RSVP" ON guest_rsvps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read by token" ON guest_rsvps
  FOR SELECT USING (true);

-- AI Recommendations: own access
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recommendations" ON ai_recommendations
  FOR SELECT USING (auth.uid() = mentee_id);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment participant count on booking
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_participant_count
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION increment_participants();

-- Update mentor rating on new review
CREATE OR REPLACE FUNCTION update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    rating = (SELECT AVG(rating) FROM reviews WHERE mentor_id = NEW.mentor_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE mentor_id = NEW.mentor_id)
  WHERE id = NEW.mentor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER review_rating_update
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_mentor_rating();
