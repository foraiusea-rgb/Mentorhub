# MentorHub — Product Requirements Document

## 1. Vision
MentorHub is a full-stack mentor-mentee platform enabling discovery, scheduling, payments, and AI-powered matching. Zero-install shareable links let participants join from any group chat.

## 2. User Roles
| Role | Capabilities |
|------|-------------|
| **Mentor** | Create profile with credentials, create paid/free meetings (1v1 & group, online/offline), set availability, receive payments |
| **Mentee** | Browse mentors, book meetings, pay online, get AI recommendations |
| **Guest** | Join meetings via shareable link without account (view-only + RSVP) |

## 3. Core Features

### 3.1 Authentication & Profiles
- Supabase Auth (email/password + OAuth: Google, GitHub)
- Role selection on signup (mentor/mentee/both)
- Mentor profile: bio, expertise tags, credentials, avatar, rating, hourly rate
- Mentee profile: interests, goals, learning areas

### 3.2 Meeting Management
- Types: 1v1, Group (max participants configurable)
- Mode: Online (video link) / Offline (location + map)
- Pricing: Free / Paid (Stripe integration)
- Fields: title, agenda, datetime, duration, location/link, max participants, price
- Shareable Links: Unique slug per meeting, no auth required to view/RSVP

### 3.3 Calendar & Scheduling
- Mentor sets weekly availability slots
- Visual calendar view (week/month)
- Conflict detection
- AI slot prioritization based on common availability

### 3.4 Payments (Stripe)
- Stripe Checkout for paid meetings
- Mentor onboarding via Stripe Connect
- Refund handling
- Payment history dashboard

### 3.5 AI Features (OpenRouter)
- Mentee recommendations based on interests + mentor expertise
- Smart scheduling: find optimal meeting times for groups
- Meeting agenda suggestions

### 3.6 Shareable Links Flow
1. Mentor creates meeting -> system generates /m/{slug}
2. Link shared in any chat -> opens in browser
3. Guest sees meeting details, can RSVP without account
4. Optional: create account to pay/join

## 4. Security Checklist
- Row-Level Security on all tables
- JWT validation on API routes
- CSRF protection via SameSite cookies
- Input sanitization (zod schemas)
- Rate limiting on API routes
- Stripe webhook signature verification
- Environment variables (never client-exposed)
- Content Security Policy headers
- XSS prevention (React default + CSP)
- SQL injection prevention (parameterized queries via Supabase)
