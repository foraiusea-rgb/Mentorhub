'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRequireOnboarding } from '@/hooks/useRequireOnboarding';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Badge, Avatar, StarRating, EmptyState, Skeleton, Input, Textarea } from '@/components/ui';
import { formatDate, formatPrice, EXPERTISE_OPTIONS } from '@/lib/utils';
import type { Meeting, Booking, Profile, Payment } from '@/types';

// ─── Metric Card ───
function MetricCard({ label, value, subtitle, trend, icon }: {
  label: string; value: string | number; subtitle?: string; trend?: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[16px] border border-[var(--ink-10)] p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-[12px] bg-[var(--ink-05)] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--ink-40)]">{label}</p>
        <p className="text-2xl font-bold text-[var(--ink)] mt-0.5 tracking-tight">{value}</p>
        {subtitle && <p className="text-[12px] text-[var(--ink-20)] mt-0.5">{subtitle}</p>}
        {trend && <p className="text-[12px] text-[var(--emerald)] font-medium mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}

// ─── Profile Editor ───
function ProfileEditor({ profile, onSave }: { profile: Profile; onSave: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState({
    full_name: profile.full_name, bio: profile.bio || '', headline: profile.headline || '',
    expertise_tags: profile.expertise_tags || [], hourly_rate: profile.hourly_rate || 0,
    interests: profile.interests || [], goals: profile.goals || '',
    timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [credentials, setCredentials] = useState(profile.credentials || []);
  const [credTitle, setCredTitle] = useState('');
  const [credInst, setCredInst] = useState('');
  const [saving, setSaving] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState('');
  const isMentor = profile.role === 'mentor' || profile.role === 'both';

  const save = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ ...form, credentials, updated_at: new Date().toISOString() }).eq('id', profile.id);
    setSaving(false);
    onSave();
  };

  const toggleExpertise = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      expertise_tags: prev.expertise_tags.includes(tag)
        ? prev.expertise_tags.filter((t) => t !== tag)
        : prev.expertise_tags.length < 10 ? [...prev.expertise_tags, tag] : prev.expertise_tags,
    }));
  };

  const inputClass = "w-full px-4 py-3 rounded-[12px] border border-[var(--ink-10)] bg-white text-[var(--ink)] text-sm placeholder:text-[var(--ink-40)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all";

  return (
    <div className="bg-white rounded-[20px] border border-[var(--ink-10)] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-[var(--ink)] mb-6">Edit Profile</h2>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Full Name</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Headline</label>
          <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Staff Engineer at Google" className={inputClass} />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Bio</label>
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} placeholder="Tell us about yourself..." className={`${inputClass} resize-none`} />
      </div>

      {isMentor && (
        <>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[var(--ink-60)] mb-2">Expertise</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {EXPERTISE_OPTIONS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleExpertise(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    form.expertise_tags.includes(tag) ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--ink-10)] text-[var(--ink-60)] hover:border-[var(--ink-20)]'
                  }`}>
                  {tag}{form.expertise_tags.includes(tag) && ' ×'}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Hourly Rate ($)</label>
            <input type="number" min={0} value={form.hourly_rate || ''} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} className={`${inputClass} max-w-[200px]`} />
          </div>
        </>
      )}

      <div className="mb-5">
        <label className="block text-sm font-semibold text-[var(--ink-60)] mb-2">Credentials</label>
        {credentials.map((c, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[var(--ink)]">{c.title} — {c.institution}</span>
            <button onClick={() => setCredentials(credentials.filter((_, j) => j !== i))} className="text-xs text-[var(--rose)] hover:underline cursor-pointer">Remove</button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input placeholder="Title (e.g. MSc CS)" value={credTitle} onChange={(e) => setCredTitle(e.target.value)} className={`${inputClass} flex-1`} />
          <input placeholder="Institution" value={credInst} onChange={(e) => setCredInst(e.target.value)} className={`${inputClass} flex-1`} />
          <button onClick={() => { if (credTitle && credInst) { setCredentials([...credentials, { title: credTitle, institution: credInst }]); setCredTitle(''); setCredInst(''); } }}
            className="px-4 py-2 bg-[var(--ink-05)] text-[var(--ink-60)] text-sm font-medium rounded-[10px] hover:bg-[var(--ink-10)] transition-colors cursor-pointer whitespace-nowrap">
            Add
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[var(--ink-05)]">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-[12px] hover:bg-[var(--ink-80)] transition-all disabled:opacity-50 cursor-pointer">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───
export default function DashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useRequireOnboarding();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'bookings' | 'profile'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [meetingsRes, bookingsRes, paymentsRes] = await Promise.all([
          supabase.from('meetings').select('*, slots:meeting_slots(*)').eq('mentor_id', user.id).order('created_at', { ascending: false }),
          supabase.from('bookings').select('*, meeting:meetings(*), slot:meeting_slots(*), mentor:profiles!bookings_mentor_id_fkey(full_name, avatar_url), mentee:profiles!bookings_mentee_id_fkey(full_name, avatar_url)')
            .or(`mentee_id.eq.${user.id},mentor_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(50),
          supabase.from('payments').select('*')
            .or(`payer_id.eq.${user.id},mentor_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(100),
        ]);
        if (meetingsRes.data) setMeetings(meetingsRes.data as Meeting[]);
        if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);
        if (paymentsRes.data) setPayments(paymentsRes.data as Payment[]);
      } catch (e) {
        console.error('Dashboard data load error:', e);
      }
      setLoading(false);
    };
    load();
  }, [user, supabase]);

  const generateShareLink = async (meetingId: string) => {
    if (!user) return;
    const shareId = Math.random().toString(36).substring(2, 10);
    await supabase.from('share_links').insert({ share_id: shareId, mentor_id: user.id, meeting_id: meetingId, is_active: true });
    const url = `${window.location.origin}/schedule/${shareId}`;
    await navigator.clipboard.writeText(url);
    alert(`Link copied: ${url}`);
  };

  if (authLoading || loading) return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-[var(--ink-05)] rounded-[20px]" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map((i) => <div key={i} className="h-28 bg-[var(--ink-05)] rounded-[16px]" />)}</div>
        <div className="h-64 bg-[var(--ink-05)] rounded-[20px]" />
      </div>
    </div>
  );

  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/auth';
    return null;
  }

  if (!profile) return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
      <p className="text-[var(--ink-40)]">Could not load your profile.</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-[var(--ink)] text-white rounded-[12px] text-sm font-semibold cursor-pointer">Retry</button>
    </div>
  );

  const isMentor = profile.role === 'mentor' || profile.role === 'both';
  const isMentee = profile.role === 'mentee' || profile.role === 'both';

  // ── Compute metrics ──
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed');
  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed' && b.slot?.start_time && new Date(b.slot.start_time) > new Date());
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  // Mentor metrics
  const mentorBookings = bookings.filter((b) => b.mentor_id === user.id);
  const mentorRevenue = payments.filter((p) => p.mentor_id === user.id && p.status === 'succeeded').reduce((sum, p) => sum + Number(p.amount), 0);
  const activeMeetings = meetings.filter((m) => m.is_active);
  const totalSlots = meetings.reduce((sum, m) => sum + (m.slots?.length || 0), 0);

  // Mentee metrics
  const menteeBookings = bookings.filter((b) => b.mentee_id === user.id);
  const menteeSpend = payments.filter((p) => p.payer_id === user.id && p.status === 'succeeded').reduce((sum, p) => sum + Number(p.amount), 0);

  // Icons as inline SVGs
  const icons = {
    calendar: <svg className="w-5 h-5 text-[var(--ink-40)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
    dollar: <svg className="w-5 h-5 text-[var(--ink-40)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    star: <svg className="w-5 h-5 text-[var(--ink-40)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
    users: <svg className="w-5 h-5 text-[var(--ink-40)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    bolt: <svg className="w-5 h-5 text-[var(--ink-40)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
    clock: <svg className="w-5 h-5 text-[var(--ink-40)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    check: <svg className="w-5 h-5 text-[var(--ink-40)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    share: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  };

  const tabs = isMentor
    ? ['overview', 'meetings', 'bookings', 'profile'] as const
    : ['overview', 'bookings', 'profile'] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-xl font-bold text-[var(--accent)]">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>
            {profile.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[var(--emerald)] rounded-full flex items-center justify-center border-2 border-white">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--ink)]">{profile.full_name}</h1>
            <p className="text-sm text-[var(--ink-40)]">{profile.headline || profile.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                isMentor ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--ink-05)] text-[var(--ink-60)]'
              }`}>{profile.role}</span>
              {profile.rating > 0 && (
                <span className="flex items-center gap-1 text-[12px] text-[var(--ink-40)]">
                  <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {profile.rating.toFixed(1)} ({profile.total_reviews})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isMentor && (
            <Link href="/meetings/create">
              <button className="px-5 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-[12px] hover:bg-[var(--ink-80)] transition-all cursor-pointer">
                Create Meeting
              </button>
            </Link>
          )}
          <Link href="/explore">
            <button className="px-5 py-2.5 bg-white border border-[var(--ink-10)] text-[var(--ink-60)] text-sm font-semibold rounded-[12px] hover:border-[var(--ink-20)] hover:text-[var(--ink)] transition-all cursor-pointer">
              Explore Mentors
            </button>
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-[var(--ink-05)] rounded-[12px] p-1 mb-8 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`px-5 py-2 text-sm font-medium rounded-[10px] transition-all capitalize whitespace-nowrap cursor-pointer ${
              activeTab === t ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--ink-40)] hover:text-[var(--ink-60)]'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-up">

          {/* Metrics Grid */}
          {isMentor ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="Revenue" value={mentorRevenue > 0 ? formatPrice(mentorRevenue) : '$0'} subtitle="Lifetime earnings" icon={icons.dollar} />
              <MetricCard label="Active Meetings" value={activeMeetings.length} subtitle={`${totalSlots} total slots`} icon={icons.calendar} />
              <MetricCard label="Total Sessions" value={profile.total_sessions} subtitle={`${mentorBookings.filter(b => b.status === 'confirmed').length} upcoming`} icon={icons.users} />
              <MetricCard label="Rating" value={profile.rating > 0 ? profile.rating.toFixed(1) : '—'} subtitle={`${profile.total_reviews} reviews`} icon={icons.star} />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="Sessions" value={profile.total_sessions} subtitle={`${upcomingBookings.length} upcoming`} icon={icons.calendar} />
              <MetricCard label="Total Spend" value={menteeSpend > 0 ? formatPrice(menteeSpend) : '$0'} subtitle="Lifetime investment" icon={icons.dollar} />
              <MetricCard label="Mentors" value={new Set(menteeBookings.map(b => b.mentor_id)).size} subtitle="Unique mentors" icon={icons.users} />
              <MetricCard label="Completed" value={completedBookings.length} subtitle="Sessions finished" icon={icons.check} />
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-[20px] border border-[var(--ink-10)] p-6">
            <h3 className="text-sm font-semibold text-[var(--ink-60)] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {isMentor && (
                <>
                  <Link href="/meetings/create" className="flex flex-col items-center gap-2 p-4 rounded-[14px] bg-[var(--ink-05)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] text-[var(--ink-60)] transition-all cursor-pointer group">
                    <svg className="w-6 h-6 group-hover:text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="text-xs font-medium">New Meeting</span>
                  </Link>
                  <Link href="/calendar" className="flex flex-col items-center gap-2 p-4 rounded-[14px] bg-[var(--ink-05)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] text-[var(--ink-60)] transition-all cursor-pointer group">
                    <svg className="w-6 h-6 group-hover:text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                    <span className="text-xs font-medium">Calendar</span>
                  </Link>
                </>
              )}
              <Link href="/explore" className="flex flex-col items-center gap-2 p-4 rounded-[14px] bg-[var(--ink-05)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] text-[var(--ink-60)] transition-all cursor-pointer group">
                <svg className="w-6 h-6 group-hover:text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <span className="text-xs font-medium">Explore</span>
              </Link>
              <Link href="/ai/recommendations" className="flex flex-col items-center gap-2 p-4 rounded-[14px] bg-[var(--ink-05)] hover:bg-[var(--violet-soft)] hover:text-[var(--violet)] text-[var(--ink-60)] transition-all cursor-pointer group">
                <svg className="w-6 h-6 group-hover:text-[var(--violet)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                <span className="text-xs font-medium">AI Match</span>
              </Link>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-[20px] border border-[var(--ink-10)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--ink-60)]">Recent Bookings</h3>
              {bookings.length > 0 && (
                <button onClick={() => setActiveTab('bookings')} className="text-xs font-medium text-[var(--accent)] hover:underline cursor-pointer">View all</button>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-[var(--ink-05)] rounded-[12px] animate-pulse" />)}</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--ink-40)]">No bookings yet.</p>
                <p className="text-xs text-[var(--ink-20)] mt-1">{isMentor ? 'Create a meeting and share it to get bookings.' : 'Explore mentors to book your first session.'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-[12px] bg-[var(--ink-05)]/50 hover:bg-[var(--ink-05)] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-xs font-bold text-[var(--accent)] flex-shrink-0">
                        {(b.mentor_id === user.id ? (b.mentee as any)?.full_name : (b.mentor as any)?.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--ink)] truncate">{b.meeting?.title || 'Meeting'}</p>
                        <p className="text-[12px] text-[var(--ink-40)]">
                          {b.mentor_id === user.id ? `with ${(b.mentee as any)?.full_name || 'Guest'}` : `with ${(b.mentor as any)?.full_name || 'Mentor'}`}
                          {b.slot?.start_time && ` · ${formatDate(b.slot.start_time)}`}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize flex-shrink-0 ${
                      b.status === 'confirmed' ? 'bg-[var(--emerald-soft)] text-[var(--emerald)]'
                      : b.status === 'completed' ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : b.status === 'cancelled' ? 'bg-[var(--rose-soft)] text-[var(--rose)]'
                      : 'bg-[var(--amber-soft)] text-[var(--amber)]'
                    }`}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Meetings Tab (Mentor) ── */}
      {activeTab === 'meetings' && (
        <div className="space-y-3 animate-fade-up">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--ink-05)] rounded-[16px] animate-pulse" />)}</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[var(--ink-05)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                {icons.calendar}
              </div>
              <p className="text-sm font-medium text-[var(--ink)]">No meetings yet</p>
              <p className="text-xs text-[var(--ink-40)] mt-1">Create your first meeting to start accepting bookings.</p>
              <Link href="/meetings/create">
                <button className="mt-4 px-5 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-[12px] hover:bg-[var(--ink-80)] transition-all cursor-pointer">Create Meeting</button>
              </Link>
            </div>
          ) : (
            meetings.map((m) => (
              <div key={m.id} className="bg-white rounded-[16px] border border-[var(--ink-10)] p-5 hover:border-[var(--ink-20)] transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-[var(--ink)]">{m.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.is_free ? 'bg-[var(--emerald-soft)] text-[var(--emerald)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'}`}>
                        {m.is_free ? 'Free' : formatPrice(m.price, m.currency)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--ink-05)] text-[var(--ink-60)] capitalize">{m.meeting_type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-[var(--ink-40)] line-clamp-1">{m.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--ink-20)]">
                      <span>{m.duration_minutes} min</span>
                      <span className="capitalize">{m.meeting_mode}</span>
                      <span>{m.slots?.length || 0} slots</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => generateShareLink(m.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--ink-60)] bg-[var(--ink-05)] rounded-[10px] hover:bg-[var(--ink-10)] transition-colors cursor-pointer">
                      {icons.share} Share
                    </button>
                    <Link href={`/meetings/${m.id}`}>
                      <button className="px-3 py-2 text-xs font-medium text-[var(--accent)] bg-[var(--accent-soft)] rounded-[10px] hover:bg-blue-100 transition-colors cursor-pointer">View</button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Bookings Tab ── */}
      {activeTab === 'bookings' && (
        <div className="space-y-3 animate-fade-up">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-[var(--ink-05)] rounded-[16px] animate-pulse" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[var(--ink-05)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                {icons.clock}
              </div>
              <p className="text-sm font-medium text-[var(--ink)]">No bookings yet</p>
              <p className="text-xs text-[var(--ink-40)] mt-1">{isMentor ? 'Share your meetings to get bookings.' : 'Browse mentors to book a session.'}</p>
            </div>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-[16px] border border-[var(--ink-10)] p-4 hover:border-[var(--ink-20)] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-sm font-bold text-[var(--accent)] flex-shrink-0">
                      {(b.mentor_id === user.id ? (b.mentee as any)?.full_name : (b.mentor as any)?.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--ink)] truncate">{b.meeting?.title || 'Meeting'}</p>
                      <p className="text-[12px] text-[var(--ink-40)]">
                        {b.mentor_id === user.id ? `with ${(b.mentee as any)?.full_name || 'Guest'}` : `with ${(b.mentor as any)?.full_name || 'Mentor'}`}
                      </p>
                      {b.slot?.start_time && <p className="text-[12px] text-[var(--ink-20)]">{formatDate(b.slot.start_time)}</p>}
                      {b.notes && <p className="text-[12px] text-[var(--ink-20)] mt-0.5 truncate">{b.notes}</p>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize flex-shrink-0 ${
                    b.status === 'confirmed' ? 'bg-[var(--emerald-soft)] text-[var(--emerald)]'
                    : b.status === 'completed' ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : b.status === 'cancelled' ? 'bg-[var(--rose-soft)] text-[var(--rose)]'
                    : 'bg-[var(--amber-soft)] text-[var(--amber)]'
                  }`}>{b.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="animate-fade-up">
          <ProfileEditor profile={profile} onSave={() => refreshProfile?.()} />
        </div>
      )}
    </div>
  );
}
