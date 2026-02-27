'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, Button, Badge, Avatar, StarRating, Skeleton } from '@/components/ui';
import type { Profile } from '@/types';

interface Recommendation {
  mentor_id: string;
  score: number;
  reason: string;
  mentor?: Profile;
}

export default function AIRecommendationsPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [allMentors, setAllMentors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const fetchMentors = async () => {
      const { data } = await supabase.from('profiles').select('*')
        .or('role.eq.mentor,role.eq.both').limit(50);
      if (data) setAllMentors(data as Profile[]);
    };
    fetchMentors();
  }, [supabase]);

  const getRecommendations = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentee: { expertise_tags: profile.expertise_tags, bio: profile.bio },
          mentors: allMentors.map((m) => ({
            id: m.id, full_name: m.full_name, expertise: m.expertise_tags,
            bio: m.bio, rating: m.rating, hourly_rate: m.hourly_rate,
          })),
        }),
      });
      const data = await res.json();
      if (data.recommendations) {
        const recs = data.recommendations.map((r: Recommendation) => ({
          ...r,
          mentor: allMentors.find((m) => m.id === r.mentor_id),
        }));
        setRecommendations(recs);
      }
    } catch (err) {
      console.error('AI recommendation error:', err);
    }
    setLoading(false);
    setFetched(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-accent-violet rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">AI Mentor Matching</h1>
        <p className="text-surface-500 max-w-xl mx-auto">
          Our AI analyzes your profile, skills, and goals to recommend the perfect mentors for your learning journey.
        </p>
      </div>

      {profile && (
        <Card className="!p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-surface-900">Your Profile</h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.expertise_tags.length > 0 ? (
                  profile.expertise_tags.map((e) => <Badge key={e} variant="brand" className="text-xs">{e}</Badge>)
                ) : (
                  <span className="text-sm text-surface-400">Add expertise to your profile for better matches</span>
                )}
              </div>
            </div>
            <Button onClick={getRecommendations} loading={loading} disabled={allMentors.length === 0}>
              {fetched ? 'Refresh Matches' : 'Find My Mentors'}
            </Button>
          </div>
        </Card>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-surface-900">Your Top Matches</h2>
          {recommendations.map((rec, i) => (
            <Card key={rec.mentor_id} hover className="!p-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar src={rec.mentor?.avatar_url} name={rec.mentor?.full_name || '?'} size="lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/profile/${rec.mentor_id}`} className="font-semibold text-surface-900 hover:text-brand-600">
                      {rec.mentor?.full_name}
                    </Link>
                    <Badge variant="brand">{rec.score}% match</Badge>
                    {rec.mentor?.is_verified && <Badge variant="success">✓</Badge>}
                  </div>
                  <p className="text-sm text-surface-500 mb-2">{rec.mentor?.headline}</p>
                  <p className="text-sm text-surface-600 mb-3">{rec.reason}</p>
                  <div className="flex items-center gap-3">
                    {rec.mentor && <StarRating rating={Math.round(rec.mentor.rating)} size={14} />}
                    <span className="text-xs text-surface-500">{rec.mentor?.total_sessions} sessions</span>
                    {rec.mentor?.hourly_rate && <span className="text-xs font-medium text-surface-700">${rec.mentor.hourly_rate}/hr</span>}
                  </div>
                </div>
                <Link href={`/profile/${rec.mentor_id}`}>
                  <Button variant="outline" size="sm">View Profile</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {fetched && recommendations.length === 0 && !loading && (
        <Card className="text-center !p-12">
          <div className="text-4xl mb-4">🤔</div>
          <h3 className="font-semibold text-surface-900 mb-2">No matches found</h3>
          <p className="text-surface-500">Try updating your profile with more expertise areas, or check back later as new mentors join.</p>
        </Card>
      )}

      {/* Browse All Mentors */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-bold text-surface-900 mb-4">All Mentors</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {allMentors.map((m) => (
            <Link key={m.id} href={`/profile/${m.id}`}>
              <Card hover>
                <div className="flex items-center gap-3">
                  <Avatar src={m.avatar_url} name={m.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 truncate">{m.full_name}</p>
                    <p className="text-sm text-surface-500 truncate">{m.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={Math.round(m.rating)} size={12} />
                      <span className="text-xs text-surface-400">{m.total_sessions} sessions</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
