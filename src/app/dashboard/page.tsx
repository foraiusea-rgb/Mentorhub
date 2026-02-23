'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Badge, Avatar, StarRating, EmptyState, Skeleton, Input, Textarea, Toggle } from '@/components/ui';
import { formatDate, EXPERTISE_OPTIONS, generateShareId } from '@/lib/utils';
import type { Meeting, Booking, Profile } from '@/types';

function ProfileEditor({ profile, onSave }: { profile: Profile; onSave: () => void }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    full_name: profile.full_name, bio: profile.bio || '', headline: profile.headline || '',
    role: profile.role, expertise: profile.expertise || [], hourly_rate: profile.hourly_rate || 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [credTitle, setCredTitle] = useState('');
  const [credInst, setCredInst] = useState('');
  const [credentials, setCredentials] = useState(profile.credentials || []);
  const [saving, setSaving] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState('');

  const save = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ ...form, credentials, updated_at: new Date().toISOString() }).eq('id', profile.id);
    setSaving(false);
    onSave();
  };

  return (
    <Card className="!p-8">
      <h2 className="font-display text-2xl font-bold text-surface-900 mb-6">Edit Profile</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input label="Headline" placeholder="e.g. Senior Engineer @ Google" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
      </div>
      <div className="mt-4">
        <Textarea label="Bio" rows={4} placeholder="Tell mentees about yourself..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-surface-700 mb-2">Role</label>
        <div className="flex gap-2">
          {(['mentee', 'mentor', 'both'] as const).map((r) => (
            <button key={r} onClick={() => setForm({ ...form, role: r })}
              className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all capitalize ${form.role === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      {(form.role === 'mentor' || form.role === 'both') && (
        <div className="mt-4">
          <Input label="Hourly Rate ($)" type="number" min={0} value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
        </div>
      )}
      <div className="mt-4">
        <label className="block text-sm font-medium text-surface-700 mb-2">Expertise</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.expertise.map((exp) => (
            <Badge key={exp} variant="brand" className="cursor-pointer" onClick={() => setForm({ ...form, expertise: form.expertise.filter((e) => e !== exp) })}>
              {exp} ×
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add expertise..." value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && expertiseInput) { e.preventDefault(); setForm({ ...form, expertise: [...form.expertise, expertiseInput] }); setExpertiseInput(''); } }} />
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {EXPERTISE_OPTIONS.filter((e) => !form.expertise.includes(e)).slice(0, 8).map((exp) => (
            <button key={exp} onClick={() => setForm({ ...form, expertise: [...form.expertise, exp] })}
              className="text-xs px-2 py-1 rounded-lg bg-surface-100 text-surface-600 hover:bg-brand-50 hover:text-brand-700 transition-colors">{exp}</button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-surface-700 mb-2">Credentials</label>
        {credentials.map((c, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <Badge variant="success">{c.title} — {c.institution}</Badge>
            <button onClick={() => setCredentials(credentials.filter((_, j) => j !== i))} className="text-xs text-accent-rose">Remove</button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input placeholder="Title (e.g. MSc Computer Science)" value={credTitle} onChange={(e) => setCredTitle(e.target.value)} />
          <Input placeholder="Institution" value={credInst} onChange={(e) => setCredInst(e.target.value)} />
          <Button variant="secondary" size="sm" onClick={() => { if (credTitle && credInst) { setCredentials([...credentials, { title: credTitle, institution: credInst }]); setCredTitle(''); setCredInst(''); } }}>Add</Button>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save} loading={saving}>Save Profile</Button>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const supabase = createClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'bookings' | 'profile'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [meetingsRes, bookingsRes] = await Promise.all([
        supabase.from('meetings').select('*, slots:meeting_slots(*)').eq('mentor_id', user.id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, meeting:meetings(*), slot:meeting_slots(*), mentor:profiles!bookings_mentor_id_fkey(*)')
          .or(`mentee_id.eq.${user.id},mentor_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(20),
      ]);
      if (meetingsRes.data) setMeetings(meetingsRes.data as Meeting[]);
      if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);
      setLoading(false);
    };
    fetch();
  }, [user, supabase]);

  const createShareLink = async (meetingId: string) => {
    if (!user) return;
    const shareId = generateShareId();
    await supabase.from('share_links').insert({ share_id: shareId, mentor_id: user.id, meeting_id: meetingId, is_active: true });
    const url = `${window.location.origin}/schedule/${shareId}`;
    navigator.clipboard.writeText(url);
    alert(`Link copied: ${url}`);
  };

  if (authLoading) return <div className="max-w-6xl mx-auto px-4 py-12"><Skeleton className="h-96 w-full" /></div>;
  if (!profile) return null;

  const isMentor = profile.role === 'mentor' || profile.role === 'both';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" />
          <div>
            <h1 className="font-display text-3xl font-bold text-surface-900">{profile.full_name}</h1>
            <p className="text-surface-500">{profile.headline || profile.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={profile.role === 'mentor' ? 'brand' : profile.role === 'both' ? 'success' : 'default'} className="capitalize">{profile.role}</Badge>
              {profile.is_verified && <Badge variant="success">✓ Verified</Badge>}
              {profile.rating > 0 && <StarRating rating={Math.round(profile.rating)} size={14} />}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isMentor && <Link href="/meetings/create"><Button>Create Meeting</Button></Link>}
          <Link href="/ai/recommendations"><Button variant="outline">AI Recommendations</Button></Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-8 overflow-x-auto">
        {(['overview', 'meetings', 'bookings', 'profile'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all capitalize whitespace-nowrap ${activeTab === t ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Sessions', value: profile.total_sessions, icon: '📅' },
              { label: 'Reviews', value: profile.total_reviews, icon: '⭐' },
              { label: 'Active Meetings', value: meetings.filter((m) => m.is_active).length, icon: '🎯' },
              { label: 'Upcoming Bookings', value: bookings.filter((b) => b.status === 'confirmed').length, icon: '📋' },
            ].map((stat) => (
              <Card key={stat.label}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                    <p className="text-sm text-surface-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="font-semibold text-surface-900 mb-4">Recent Bookings</h3>
            {bookings.length === 0 ? (
              <p className="text-surface-500 text-sm">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                    <div>
                      <p className="font-medium text-surface-900">{b.meeting?.title || 'Meeting'}</p>
                      <p className="text-sm text-surface-500">{b.slot?.start_time ? formatDate(b.slot.start_time) : 'TBD'}</p>
                    </div>
                    <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'default'} className="capitalize">{b.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Meetings */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          {meetings.length === 0 ? (
            <EmptyState title="No meetings yet" description={isMentor ? 'Create your first meeting to get started.' : 'Browse mentors to find meetings.'} action={isMentor ? <Link href="/meetings/create"><Button>Create Meeting</Button></Link> : undefined} />
          ) : (
            meetings.map((m) => (
              <Card key={m.id} hover>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-surface-900">{m.title}</h3>
                      <Badge variant={m.is_free ? 'success' : 'brand'}>{m.is_free ? 'Free' : `$${m.price}`}</Badge>
                      <Badge variant="default" className="capitalize">{m.format.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-surface-500 line-clamp-1">{m.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-400">
                      <span>{m.duration_minutes} min</span>
                      <span className="capitalize">{m.meeting_type}</span>
                      <span>{m.slots?.length || 0} slots</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => createShareLink(m.id)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      Share
                    </Button>
                    <Link href={`/meetings/${m.id}`}><Button variant="secondary" size="sm">View</Button></Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <EmptyState title="No bookings yet" description="Book a session with a mentor to get started." />
          ) : (
            bookings.map((b) => (
              <Card key={b.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-surface-900">{b.meeting?.title}</p>
                    <p className="text-sm text-surface-500">{b.slot?.start_time ? formatDate(b.slot.start_time) : ''}</p>
                    {b.notes && <p className="text-sm text-surface-400 mt-1">{b.notes}</p>}
                  </div>
                  <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : b.status === 'completed' ? 'brand' : 'warning'} className="capitalize">{b.status}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Profile Editor */}
      {activeTab === 'profile' && <ProfileEditor profile={profile} onSave={() => refreshProfile?.()} />}
    </div>
  );
}
