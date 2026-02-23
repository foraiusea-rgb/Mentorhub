'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, Badge, Avatar, StarRating, Skeleton, Textarea } from '@/components/ui';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Meeting, MeetingSlot, Profile, Review } from '@/types';

function formatPrice2(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [mentor, setMentor] = useState<Profile | null>(null);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: m } = await supabase.from('meetings').select('*').eq('id', id).single();
      if (!m) { setLoading(false); return; }
      setMeeting(m as Meeting);

      const [mentorRes, slotsRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', m.mentor_id).single(),
        supabase.from('meeting_slots').select('*').eq('meeting_id', id).eq('is_available', true).gte('start_time', new Date().toISOString()).order('start_time'),
        supabase.from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)').eq('reviewee_id', m.mentor_id).order('created_at', { ascending: false }).limit(10),
      ]);
      if (mentorRes.data) setMentor(mentorRes.data as Profile);
      if (slotsRes.data) setSlots(slotsRes.data as MeetingSlot[]);
      if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
      setLoading(false);
    };
    fetch();
  }, [id, supabase]);

  const handleBook = async () => {
    if (!user || !selectedSlot || !meeting) return;
    setBooking(true);

    if (!meeting.is_free) {
      // Redirect to Stripe checkout
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: meeting.id, slot_id: selectedSlot, notes }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else { alert('Payment error'); setBooking(false); }
      return;
    }

    // Free booking
    const { error } = await supabase.rpc('book_slot', {
      p_slot_id: selectedSlot, p_meeting_id: meeting.id, p_mentee_id: user.id, p_mentor_id: meeting.mentor_id, p_notes: notes || null,
    });

    if (error) { alert(error.message); }
    else { router.push('/dashboard?booked=true'); }
    setBooking(false);
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12"><Skeleton className="h-96" /></div>;
  if (!meeting) return <div className="text-center py-20 text-surface-500">Meeting not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={meeting.is_free ? 'success' : 'brand'}>{meeting.is_free ? 'Free' : formatPrice2(meeting.price, meeting.currency)}</Badge>
              <Badge variant="default" className="capitalize">{meeting.format.replace('_', ' ')}</Badge>
              <Badge variant="default" className="capitalize">{meeting.meeting_type}</Badge>
              <Badge variant="default">{meeting.duration_minutes} min</Badge>
            </div>
            <h1 className="font-display text-3xl font-bold text-surface-900 mb-3">{meeting.title}</h1>
            <p className="text-surface-600 leading-relaxed">{meeting.description}</p>
          </div>

          {meeting.agenda && meeting.agenda.length > 0 && (
            <Card>
              <h2 className="font-semibold text-surface-900 mb-4">Agenda</h2>
              <div className="space-y-3">
                {meeting.agenda.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                    <div>
                      <p className="font-medium text-surface-900">{item.title}</p>
                      <p className="text-xs text-surface-500">{item.duration_minutes} minutes</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {meeting.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {meeting.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
            </div>
          )}

          {/* Mentor Profile */}
          {mentor && (
            <Card>
              <div className="flex items-start gap-4">
                <Avatar src={mentor.avatar_url} name={mentor.full_name} size="lg" />
                <div className="flex-1">
                  <Link href={`/profile/${mentor.id}`} className="font-semibold text-surface-900 hover:text-brand-600">{mentor.full_name}</Link>
                  <p className="text-sm text-surface-500">{mentor.headline}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={Math.round(mentor.rating)} size={14} />
                    <span className="text-xs text-surface-500">({mentor.total_reviews} reviews)</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {mentor.expertise.slice(0, 5).map((e) => <Badge key={e} variant="brand" className="text-xs">{e}</Badge>)}
                  </div>
                  {mentor.credentials && mentor.credentials.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {mentor.credentials.slice(0, 3).map((c, i) => (
                        <p key={i} className="text-xs text-surface-500">🎓 {c.title} — {c.institution}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <Card>
              <h2 className="font-semibold text-surface-900 mb-4">Reviews</h2>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <Avatar name={(r.reviewer as any)?.full_name || 'User'} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-surface-900">{(r.reviewer as any)?.full_name}</span>
                        <StarRating rating={r.rating} size={12} />
                      </div>
                      <p className="text-sm text-surface-600 mt-1">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="!p-6">
              <h2 className="font-semibold text-surface-900 mb-4">Book This Session</h2>

              {!user ? (
                <div className="text-center py-4">
                  <p className="text-sm text-surface-500 mb-3">Sign in to book this session</p>
                  <Link href={`/auth?redirect=/meetings/${id}`}><Button className="w-full">Sign In</Button></Link>
                </div>
              ) : user.id === meeting.mentor_id ? (
                <p className="text-sm text-surface-500 text-center py-4">This is your meeting</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">No available slots</p>
              ) : (
                <>
                  <p className="text-sm text-surface-500 mb-3">Select a time slot:</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                    {slots.map((slot) => (
                      <button key={slot.id} onClick={() => setSelectedSlot(slot.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${selectedSlot === slot.id ? 'border-brand-500 bg-brand-50' : 'border-surface-100 hover:border-surface-300'}`}>
                        <p className="font-medium">{formatDate(slot.start_time)}</p>
                        <p className="text-xs text-surface-500">{slot.spots_available - slot.spots_taken} spot{slot.spots_available - slot.spots_taken !== 1 ? 's' : ''} left</p>
                      </button>
                    ))}
                  </div>
                  <Textarea placeholder="Any notes for the mentor? (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mb-4" />
                  <Button className="w-full" size="lg" loading={booking} onClick={handleBook} disabled={!selectedSlot}>
                    {meeting.is_free ? 'Book Free Session' : `Pay ${formatPrice2(meeting.price, meeting.currency)} & Book`}
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
