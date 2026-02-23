'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Badge, Avatar, Button, StarRating, Input, Skeleton } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { ShareLink, Meeting, Profile, MeetingSlot } from '@/types';

export default function ShareSchedulePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const supabase = createClient();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [mentor, setMentor] = useState<Profile | null>(null);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Increment view count
      await supabase.rpc('increment_share_view', { link_share_id: shareId });

      const { data: link } = await supabase.from('share_links').select('*').eq('share_id', shareId).eq('is_active', true).single();
      if (!link) { setLoading(false); return; }
      setShareLink(link as ShareLink);

      const [mentorRes, meetingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', link.mentor_id).single(),
        link.meeting_id ? supabase.from('meetings').select('*').eq('id', link.meeting_id).single() : Promise.resolve({ data: null }),
      ]);

      if (mentorRes.data) setMentor(mentorRes.data as Profile);
      if (meetingRes.data) {
        setMeeting(meetingRes.data as Meeting);
        const { data: slotsData } = await supabase.from('meeting_slots').select('*')
          .eq('meeting_id', meetingRes.data.id).eq('is_available', true)
          .gte('start_time', new Date().toISOString()).order('start_time');
        if (slotsData) setSlots(slotsData as MeetingSlot[]);
      }
      setLoading(false);
    };
    fetch();
  }, [shareId, supabase]);

  const handleRespond = async () => {
    if (!selectedSlot || !name || !email) return;
    // For anonymous users, we create a notification for the mentor
    if (mentor) {
      await supabase.from('notifications').insert({
        user_id: mentor.id, type: 'share_response',
        title: `${name} responded to your scheduling link`,
        message: `${name} (${email}) selected a time slot for ${meeting?.title || 'your meeting'}.`,
        data: { slot_id: selectedSlot, name, email, meeting_id: meeting?.id },
      });
    }
    setSubmitted(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Skeleton className="h-96 w-full max-w-lg" />
    </div>
  );

  if (!shareLink || !mentor) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="text-center !p-12 max-w-md">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">Link Not Found</h1>
        <p className="text-surface-500">This scheduling link may have expired or been deactivated.</p>
      </Card>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="text-center !p-12 max-w-md animate-scale-in">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">You&apos;re All Set!</h1>
        <p className="text-surface-500">Your response has been sent to {mentor.full_name}. They&apos;ll follow up with a confirmation.</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 pattern-dots opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-100/30 rounded-full blur-3xl" />

      <div className="relative w-full max-w-lg">
        <Card className="!p-8">
          {/* Mentor Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-100">
            <Avatar src={mentor.avatar_url} name={mentor.full_name} size="lg" />
            <div>
              <h2 className="font-semibold text-surface-900">{mentor.full_name}</h2>
              <p className="text-sm text-surface-500">{mentor.headline}</p>
              {mentor.rating > 0 && <StarRating rating={Math.round(mentor.rating)} size={14} />}
            </div>
          </div>

          {/* Meeting Info */}
          {meeting && (
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">{meeting.title}</h1>
              <p className="text-surface-500 text-sm mb-3">{meeting.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={meeting.is_free ? 'success' : 'brand'}>{meeting.is_free ? 'Free' : `$${meeting.price}`}</Badge>
                <Badge>{meeting.duration_minutes} min</Badge>
                <Badge className="capitalize">{meeting.meeting_type}</Badge>
              </div>
            </div>
          )}

          {/* Slot Selection */}
          {slots.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-surface-900 mb-3">Select a time:</h3>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {slots.map((slot) => (
                  <button key={slot.id} onClick={() => setSelectedSlot(slot.id)}
                    className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${selectedSlot === slot.id ? 'border-brand-500 bg-brand-50' : 'border-surface-100 hover:border-surface-300'}`}>
                    <p className="font-medium">{formatDate(slot.start_time, { dateStyle: 'short', timeStyle: 'short' })}</p>
                    <p className="text-xs text-surface-500">{slot.spots_available - slot.spots_taken} spots</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            <Input label="Your Name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Your Email" type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <Button className="w-full" size="lg" onClick={handleRespond} disabled={!selectedSlot || !name || !email}>
            Confirm Selection
          </Button>

          <p className="text-xs text-surface-400 text-center mt-4">
            Powered by MentorHub • No account required
          </p>
        </Card>
      </div>
    </div>
  );
}
