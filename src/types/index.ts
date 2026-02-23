export type UserRole = 'mentor' | 'mentee' | 'both';
export type MeetingType = 'one_on_one' | 'group';
export type MeetingMode = 'online' | 'offline' | 'hybrid';
export type MeetingStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  bio: string;
  headline: string;
  expertise_tags: string[];
  credentials: Credential[];
  interests: string[];
  goals: string;
  hourly_rate: number;
  currency: string;
  timezone: string;
  rating: number;
  total_reviews: number;
  total_sessions: number;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  is_verified: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Credential {
  title: string;
  issuer: string;
  year: number;
  url?: string;
}

export interface AvailabilitySlot {
  id: string;
  mentor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Meeting {
  id: string;
  mentor_id: string;
  slug: string;
  title: string;
  description: string;
  agenda: AgendaItem[];
  meeting_type: MeetingType;
  meeting_mode: MeetingMode;
  status: MeetingStatus;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location_name: string | null;
  location_address: string | null;
  meeting_link: string | null;
  max_participants: number;
  current_participants: number;
  price: number;
  currency: string;
  is_free: boolean;
  tags: string[];
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  mentor?: Profile;
}

export interface AgendaItem {
  title: string;
  duration_minutes: number;
  description?: string;
}

export interface Booking {
  id: string;
  meeting_id: string;
  mentee_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  status: BookingStatus;
  notes: string;
  created_at: string;
  meeting?: Meeting;
  mentee?: Profile;
}

export interface Payment {
  id: string;
  booking_id: string;
  payer_id: string | null;
  mentor_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  created_at: string;
}

export interface GuestRsvp {
  id: string;
  meeting_id: string;
  name: string;
  email: string;
  response: 'attending' | 'maybe' | 'declined';
  token: string;
  created_at: string;
}

export interface Review {
  id: string;
  meeting_id: string;
  reviewer_id: string;
  mentor_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: Profile;
}

export interface AIRecommendation {
  mentor: Profile;
  score: number;
  reasoning: string;
}
