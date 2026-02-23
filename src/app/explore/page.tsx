'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, Badge, Avatar, StarRating, Input, Button, Select, Skeleton } from '@/components/ui';
import { EXPERTISE_OPTIONS } from '@/lib/utils';
import type { Profile, Meeting } from '@/types';

export default function ExplorePage() {
  const supabase = createClient();
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'one_on_one' | 'group'>('all');
  const [tab, setTab] = useState<'mentors' | 'meetings'>('mentors');

  useEffect(() => {
    const fetch = async () => {
      const [mentorsRes, meetingsRes] = await Promise.all([
        supabase.from('profiles').select('*').or('role.eq.mentor,role.eq.both').order('rating', { ascending: false }).limit(100),
        supabase.from('meetings').select('*, mentor:profiles(*)').eq('is_active', true).order('created_at', { ascending: false }).limit(100),
      ]);
      if (mentorsRes.data) setMentors(mentorsRes.data as Profile[]);
      if (meetingsRes.data) setMeetings(meetingsRes.data as Meeting[]);
      setLoading(false);
    };
    fetch();
  }, [supabase]);

  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      if (search && !m.full_name.toLowerCase().includes(search.toLowerCase()) &&
          !m.headline?.toLowerCase().includes(search.toLowerCase()) &&
          !m.expertise.some((e) => e.toLowerCase().includes(search.toLowerCase()))) return false;
      if (expertiseFilter && !m.expertise.includes(expertiseFilter)) return false;
      return true;
    });
  }, [mentors, search, expertiseFilter]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (search && !m.title.toLowerCase().includes(search.toLowerCase()) &&
          !m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false;
      if (priceFilter === 'free' && !m.is_free) return false;
      if (priceFilter === 'paid' && m.is_free) return false;
      if (formatFilter !== 'all' && m.format !== formatFilter) return false;
      if (expertiseFilter && !m.tags.includes(expertiseFilter)) return false;
      return true;
    });
  }, [meetings, search, priceFilter, formatFilter, expertiseFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">Explore</h1>
        <p className="text-surface-500">Discover mentors and sessions that match your goals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab('mentors')} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'mentors' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500'}`}>
          Mentors ({filteredMentors.length})
        </button>
        <button onClick={() => setTab('meetings')} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'meetings' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500'}`}>
          Sessions ({filteredMeetings.length})
        </button>
      </div>

      {/* Filters */}
      <Card className="!p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search mentors, skills, topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
          </div>
          <Select
            options={[{ value: '', label: 'All Expertise' }, ...EXPERTISE_OPTIONS.slice(0, 20).map((e) => ({ value: e, label: e }))]}
            value={expertiseFilter}
            onChange={(e) => setExpertiseFilter(e.target.value)}
            className="min-w-[160px]"
          />
          {tab === 'meetings' && (
            <>
              <Select
                options={[{ value: 'all', label: 'All Prices' }, { value: 'free', label: 'Free Only' }, { value: 'paid', label: 'Paid Only' }]}
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as 'all' | 'free' | 'paid')}
                className="min-w-[130px]"
              />
              <Select
                options={[{ value: 'all', label: 'All Formats' }, { value: 'one_on_one', label: '1-on-1' }, { value: 'group', label: 'Group' }]}
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value as 'all' | 'one_on_one' | 'group')}
                className="min-w-[130px]"
              />
            </>
          )}
          {(search || expertiseFilter || priceFilter !== 'all' || formatFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setExpertiseFilter(''); setPriceFilter('all'); setFormatFilter('all'); }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : tab === 'mentors' ? (
        /* Mentor Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMentors.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-surface-500">No mentors found matching your criteria</p>
            </div>
          ) : (
            filteredMentors.map((mentor) => (
              <Link key={mentor.id} href={`/profile/${mentor.id}`}>
                <Card hover className="h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar src={mentor.avatar_url} name={mentor.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-surface-900 truncate">{mentor.full_name}</h3>
                        {mentor.is_verified && <span className="text-accent-emerald text-xs">✓</span>}
                      </div>
                      <p className="text-sm text-surface-500 truncate">{mentor.headline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={Math.round(mentor.rating)} size={14} />
                    <span className="text-xs text-surface-400">{mentor.total_reviews} reviews</span>
                    <span className="text-xs text-surface-400">• {mentor.total_sessions} sessions</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mentor.expertise.slice(0, 3).map((e) => (
                      <Badge key={e} variant="brand" className="text-xs">{e}</Badge>
                    ))}
                    {mentor.expertise.length > 3 && (
                      <Badge className="text-xs">+{mentor.expertise.length - 3}</Badge>
                    )}
                  </div>
                  {mentor.hourly_rate && (
                    <p className="text-sm font-semibold text-surface-900">${mentor.hourly_rate}/hr</p>
                  )}
                </Card>
              </Link>
            ))
          )}
        </div>
      ) : (
        /* Meetings Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-surface-500">No sessions found matching your criteria</p>
            </div>
          ) : (
            filteredMeetings.map((meeting) => (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                <Card hover className="h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={meeting.is_free ? 'success' : 'brand'}>
                      {meeting.is_free ? 'Free' : `$${meeting.price}`}
                    </Badge>
                    <Badge variant="default" className="capitalize text-xs">{meeting.format.replace('_', ' ')}</Badge>
                    <Badge variant="default" className="capitalize text-xs">{meeting.meeting_type}</Badge>
                  </div>
                  <h3 className="font-semibold text-surface-900 mb-1 line-clamp-1">{meeting.title}</h3>
                  <p className="text-sm text-surface-500 line-clamp-2 mb-3">{meeting.description}</p>
                  {meeting.mentor && (
                    <div className="flex items-center gap-2 pt-3 border-t border-surface-100">
                      <Avatar src={(meeting.mentor as Profile).avatar_url} name={(meeting.mentor as Profile).full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-700 truncate">{(meeting.mentor as Profile).full_name}</p>
                        <p className="text-xs text-surface-400">{meeting.duration_minutes} min</p>
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
