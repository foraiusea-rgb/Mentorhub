'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, Badge, Avatar, StarRating, Button, Skeleton } from '@/components/ui';
import type { Profile, Meeting, Review } from '@/types';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [profileRes, meetingsRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('meetings').select('*, slots:meeting_slots(*)').eq('mentor_id', id).eq('is_active', true),
        supabase.from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)').eq('mentor_id', id).order('created_at', { ascending: false }),
      ]);
      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (meetingsRes.data) setMeetings(meetingsRes.data as Meeting[]);
      if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
      setLoading(false);
    };
    fetch();
  }, [id, supabase]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12"><Skeleton className="h-96" /></div>;
  if (!profile) return <div className="text-center py-20 text-surface-500">Profile not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <Card className="!p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-3xl font-bold text-surface-900">{profile.full_name}</h1>
              {profile.is_verified && <Badge variant="success">✓ Verified</Badge>}
            </div>
            <p className="text-surface-500 mb-3">{profile.headline}</p>
            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={Math.round(profile.rating)} />
              <span className="text-sm text-surface-500">{profile.total_reviews} reviews • {profile.total_sessions} sessions</span>
            </div>
            <p className="text-surface-600 leading-relaxed mb-4">{profile.bio}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.expertise_tags.map((e) => <Badge key={e} variant="brand">{e}</Badge>)}
            </div>
            {profile.credentials && profile.credentials.length > 0 && (
              <div className="space-y-1">
                {profile.credentials.map((c, i) => (
                  <p key={i} className="text-sm text-surface-500">🎓 {c.title} — {c.institution} {c.year && `(${c.year})`}</p>
                ))}
              </div>
            )}
            {profile.hourly_rate && (
              <p className="mt-3 text-lg font-semibold text-surface-900">${profile.hourly_rate}/hr</p>
            )}
          </div>
        </div>
      </Card>

      {/* Meetings */}
      {meetings.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-surface-900 mb-4">Available Sessions</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {meetings.map((m) => (
              <Link key={m.id} href={`/meetings/${m.id}`}>
                <Card hover>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-surface-900">{m.title}</h3>
                    <Badge variant={m.is_free ? 'success' : 'brand'}>{m.is_free ? 'Free' : `$${m.price}`}</Badge>
                  </div>
                  <p className="text-sm text-surface-500 line-clamp-2 mb-3">{m.description}</p>
                  <div className="flex items-center gap-3 text-xs text-surface-400">
                    <span>{m.duration_minutes} min</span>
                    <span className="capitalize">{m.meeting_type.replace('_', ' ')}</span>
                    <span className="capitalize">{m.meeting_mode}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-bold text-surface-900 mb-4">Reviews</h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <Card key={r.id}>
                <div className="flex gap-3">
                  <Avatar name={(r.reviewer as any)?.full_name || 'User'} size="sm" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{(r.reviewer as any)?.full_name}</span>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                    <p className="text-sm text-surface-600">{r.comment}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
