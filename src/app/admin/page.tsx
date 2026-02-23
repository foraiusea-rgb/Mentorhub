'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge, Button, Avatar, Skeleton, Input } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/types';

interface AdminStats {
  totals: {
    users: number; mentors: number; mentees: number; verified: number;
    meetings: number; bookings: number; payments: number; reviews: number;
    totalRevenue: number; avgRating: number;
  };
  trends: { newUsers30d: number; newUsers7d: number; bookings30d: number };
}

export default function AdminPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [tab, setTab] = useState<'overview' | 'users' | 'meetings' | 'bookings'>('overview');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    const res = await fetch('/api/admin?action=stats');
    if (!res.ok) { setError(res.status === 403 ? 'Access denied. You must be an admin.' : 'Failed to load'); setLoading(false); return; }
    const data = await res.json();
    setStats(data);
    setLoading(false);
  };

  const fetchUsers = async (page: number) => {
    const res = await fetch(`/api/admin?action=users&page=${page}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setUserTotal(data.total);
      setUserPage(page);
    }
  };

  const fetchMeetings = async () => {
    const res = await fetch('/api/admin?action=meetings');
    if (res.ok) { const data = await res.json(); setMeetings(data.meetings || []); }
  };

  const fetchBookings = async () => {
    const res = await fetch('/api/admin?action=bookings');
    if (res.ok) { const data = await res.json(); setBookings(data.bookings || []); }
  };

  useEffect(() => { fetchStats(); fetchUsers(1); }, []);
  useEffect(() => { if (tab === 'meetings') fetchMeetings(); if (tab === 'bookings') fetchBookings(); }, [tab]);

  const verifyUser = async (userId: string, verify: boolean) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: verify ? 'verify_user' : 'unverify_user', user_id: userId }),
    });
    fetchUsers(userPage);
  };

  const deactivateMeeting = async (meetingId: string) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deactivate_meeting', data: { meeting_id: meetingId } }),
    });
    fetchMeetings();
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-96" /></div>;
  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">Admin Access Required</h1>
      <p className="text-surface-500 mb-4">{error}</p>
      <p className="text-sm text-surface-400">Set <code className="bg-surface-100 px-2 py-0.5 rounded">ADMIN_EMAILS</code> in your environment variables to grant access.</p>
    </div>
  );

  const t = stats?.totals;
  const tr = stats?.trends;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900">Admin Panel</h1>
          <p className="text-surface-500">Platform overview and management</p>
        </div>
        <Link href="/admin/analytics"><Button variant="outline">📊 Full Analytics</Button></Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-8 w-fit">
        {(['overview', 'users', 'meetings', 'bookings'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all capitalize ${tab === t ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && t && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Users', value: t.users, icon: '👥', color: 'text-brand-600' },
              { label: 'Mentors', value: t.mentors, icon: '🧑‍🏫', color: 'text-accent-violet' },
              { label: 'Mentees', value: t.mentees, icon: '🎓', color: 'text-accent-emerald' },
              { label: 'Meetings', value: t.meetings, icon: '📅', color: 'text-accent-amber' },
              { label: 'Bookings', value: t.bookings, icon: '📋', color: 'text-brand-600' },
              { label: 'Revenue', value: `$${t.totalRevenue.toLocaleString()}`, icon: '💰', color: 'text-accent-emerald' },
              { label: 'Reviews', value: t.reviews, icon: '⭐', color: 'text-accent-amber' },
              { label: 'Avg Rating', value: t.avgRating.toFixed(1), icon: '📊', color: 'text-brand-600' },
              { label: 'Verified', value: t.verified, icon: '✅', color: 'text-accent-emerald' },
              { label: 'Payments', value: t.payments, icon: '💳', color: 'text-accent-violet' },
            ].map((stat) => (
              <Card key={stat.label} className="!p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span>{stat.icon}</span>
                  <span className="text-xs text-surface-500">{stat.label}</span>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </Card>
            ))}
          </div>

          {tr && (
            <Card>
              <h3 className="font-semibold text-surface-900 mb-4">Trends</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-surface-500">New Users (7d)</p>
                  <p className="text-3xl font-bold text-brand-600">{tr.newUsers7d}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">New Users (30d)</p>
                  <p className="text-3xl font-bold text-brand-600">{tr.newUsers30d}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Bookings (30d)</p>
                  <p className="text-3xl font-bold text-accent-emerald">{tr.bookings30d}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <Card className="!p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500">{userTotal} total users</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={userPage <= 1} onClick={() => fetchUsers(userPage - 1)}>← Prev</Button>
                <span className="text-sm text-surface-500 self-center">Page {userPage}</span>
                <Button variant="ghost" size="sm" disabled={users.length < 20} onClick={() => fetchUsers(userPage + 1)}>Next →</Button>
              </div>
            </div>
          </Card>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Sessions</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Rating</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Joined</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-surface-50 hover:bg-surface-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
                        <div>
                          <Link href={`/profile/${u.id}`} className="font-medium text-sm text-surface-900 hover:text-brand-600">{u.full_name}</Link>
                          <p className="text-xs text-surface-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Badge variant={u.role === 'mentor' ? 'brand' : u.role === 'both' ? 'success' : 'default'} className="capitalize">{u.role}</Badge></td>
                    <td className="py-3 px-4 text-sm text-surface-700">{u.total_sessions}</td>
                    <td className="py-3 px-4 text-sm text-surface-700">{u.rating > 0 ? u.rating.toFixed(1) : '—'}</td>
                    <td className="py-3 px-4 text-sm text-surface-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {u.is_verified ? (
                          <Button variant="ghost" size="sm" onClick={() => verifyUser(u.id, false)}>Unverify</Button>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => verifyUser(u.id, true)}>✓ Verify</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Meetings */}
      {tab === 'meetings' && (
        <div className="space-y-3">
          {meetings.map((m: any) => (
            <Card key={m.id} className="!p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-surface-900">{m.title}</h3>
                    <Badge variant={m.is_active ? 'success' : 'danger'}>{m.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Badge variant={m.is_free ? 'success' : 'brand'}>{m.is_free ? 'Free' : `$${m.price}`}</Badge>
                  </div>
                  <p className="text-sm text-surface-500">by {m.mentor?.full_name} • {new Date(m.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/meetings/${m.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                  {m.is_active && <Button variant="danger" size="sm" onClick={() => deactivateMeeting(m.id)}>Deactivate</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bookings */}
      {tab === 'bookings' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Meeting</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Mentor</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Mentee</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b.id} className="border-b border-surface-50">
                  <td className="py-3 px-4 text-sm font-medium text-surface-900">{b.meeting?.title || '—'}</td>
                  <td className="py-3 px-4 text-sm text-surface-700">{b.mentor?.full_name || '—'}</td>
                  <td className="py-3 px-4 text-sm text-surface-700">{b.mentee?.full_name || '—'}</td>
                  <td className="py-3 px-4"><Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'warning'} className="capitalize">{b.status}</Badge></td>
                  <td className="py-3 px-4 text-sm text-surface-500">{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
