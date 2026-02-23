import { z } from 'zod';

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100),
  bio: z.string().max(2000).optional(),
  headline: z.string().max(200).optional(),
  role: z.enum(['mentor', 'mentee', 'both']),
  expertise_tags: z.array(z.string().max(50)).max(20).optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  goals: z.string().max(1000).optional(),
  hourly_rate: z.number().min(0).max(10000).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(50).optional(),
  credentials: z.array(z.object({
    title: z.string().max(200),
    issuer: z.string().max(200),
    year: z.number().min(1950).max(2030),
    url: z.string().url().optional(),
  })).max(20).optional(),
});

export const meetingCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  agenda: z.array(z.object({
    title: z.string().max(200),
    duration_minutes: z.number().min(1).max(480),
    description: z.string().max(500).optional(),
  })).max(20).optional(),
  meeting_type: z.enum(['one_on_one', 'group']),
  meeting_mode: z.enum(['online', 'offline', 'hybrid']),
  start_time: z.string().datetime(),
  duration_minutes: z.number().min(15).max(480),
  location_name: z.string().max(200).optional(),
  location_address: z.string().max(500).optional(),
  meeting_link: z.string().url().optional(),
  max_participants: z.number().min(1).max(500),
  price: z.number().min(0).max(100000),
  currency: z.string().length(3).default('USD'),
  is_free: z.boolean(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: z.enum(['draft', 'published']).default('published'),
});

export const bookingCreateSchema = z.object({
  meeting_id: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export const guestRsvpSchema = z.object({
  meeting_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  response: z.enum(['attending', 'maybe', 'declined']),
});

export const availabilitySchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_active: z.boolean().default(true),
});

export const reviewSchema = z.object({
  meeting_id: z.string().uuid(),
  mentor_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
