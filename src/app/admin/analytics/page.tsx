'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, Badge, Button, Skeleton } from '@/components/ui';

interface ChartData { [date: string]: number }

function MiniBarChart({ data, color = '#0a7fff', height = 120 }: { data: ChartData; color?: string; height?: number }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).slice(-30);
  if (entries.length === 0) return <div className="text-sm text-surface-400 text-center py-8">No data yet</div>;
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {entries.map(([date, value]) => (
        <div key={date} className="group relative flex-1 min-w-[4px]">
          <div
            className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
            style={{ height: `${(value / max) * 100}%`, backgroundColor: color, minHeight: value > 0 ? 4 : 0 }}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
            <div className="bg-surface-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
              {date.slice(5)}: {value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, change, icon, color = 'text-brand-600' }: {
  label: string; value: string | number; change?: string; icon: string; color?: string;
}) {
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {change && (
          <Badge variant={change.startsWith('+') ? 'success' : change.startsWith('-') ? 'danger' : 'default'} className="text-xs">
            {change}
          </Badge>
        )}
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-surface-500 mt-1">{label}</p>
    </Card>
  );
}

function DonutChart({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return <div className="text-sm text-surface-400 text-center py-8">No data</div>;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 42 42" className="flex-shrink-0">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="#f4f6f8" strokeWidth="5" />
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          const offset = 100 - cumulative + 25;
          cumulative += pct;
          return (
            <circle key={seg.label} cx="21" cy="21" r="15.915" fill="none"
              stroke={seg.color} strokeWidth="5"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          );
        })}
        <text x="21" y="21" textAnchor="middle" dy="0.35em" className="fill-surface-900" fontSize="8" fontWeight="bold">
          {total}
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-surface-700">{seg.label}</span>
            <span className="text-sm font-medium text-surface-900 ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    const fetch = async () => {
      const res = await window.fetch('/api/admin?action=stats');
      if (!res.ok) { setError('Access denied'); setLoading(false); return; }
      const data = await res.json();
      setStats(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const filteredCharts = useMemo(() => {
    if (!stats?.charts) return { signups: {}, bookings: {}, revenue: {} };
    const now = new Date();
    const cutoff = range === '7d' ? 7 : range === '30d' ? 30 : 365;
    const minDate = new Date(now.getTime() - cutoff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const filter = (data: ChartData) => Object.fromEntries(Object.entries(data).filter(([d]) => d >= minDate));
    return {
      signups: filter(stats.charts.signupsByDay),
      bookings: filter(stats.charts.bookingsByDay),
      revenue: filter(stats.charts.revenueByDay),
    };
  }, [stats, range]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-[600px]" /></div>;
  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">{error}</h1>
      <Link href="/dashboard"><Button variant="outline">← Back to Dashboard</Button></Link>
    </div>
  );

  const t = stats.totals;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900">Analytics</h1>
          <p className="text-surface-500">Platform performance and growth metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-100 rounded-lg p-0.5">
            {(['7d', '30d', 'all'] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${range === r ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500'}`}>
                {r === 'all' ? 'All Time' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <Link href="/admin"><Button variant="ghost" size="sm">← Admin</Button></Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Users" value={t.users} icon="👥" change={`+${stats.trends.newUsers7d} this week`} />
        <StatCard label="Active Mentors" value={t.mentors} icon="🧑‍🏫" color="text-accent-violet" />
        <StatCard label="Total Bookings" value={t.bookings} icon="📋" change={`+${stats.trends.bookings30d} (30d)`} color="text-accent-emerald" />
        <StatCard label="Revenue" value={`$${t.totalRevenue.toLocaleString()}`} icon="💰" color="text-accent-emerald" />
        <StatCard label="Avg Rating" value={`${t.avgRating}/5`} icon="⭐" color="text-accent-amber" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">New Signups</h3>
          <MiniBarChart data={filteredCharts.signups} color="#0a7fff" />
          <p className="text-xs text-surface-400 mt-3 text-center">
            {Object.values(filteredCharts.signups).reduce((a, b) => a + b, 0)} signups in period
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">Bookings</h3>
          <MiniBarChart data={filteredCharts.bookings} color="#10b981" />
          <p className="text-xs text-surface-400 mt-3 text-center">
            {Object.values(filteredCharts.bookings).reduce((a, b) => a + b, 0)} bookings in period
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">Revenue</h3>
          <MiniBarChart data={filteredCharts.revenue} color="#8b5cf6" />
          <p className="text-xs text-surface-400 mt-3 text-center">
            ${Object.values(filteredCharts.revenue).reduce((a, b) => a + b, 0).toLocaleString()} in period
          </p>
        </Card>
      </div>

      {/* Breakdown Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">User Roles</h3>
          <DonutChart segments={[
            { label: 'Mentors', value: t.mentors, color: '#8b5cf6' },
            { label: 'Mentees', value: t.mentees, color: '#0a7fff' },
          ]} />
        </Card>
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">Platform Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-surface-600">Verification Rate</span>
                <span className="font-medium text-surface-900">{t.users ? Math.round((t.verified / t.users) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent-emerald rounded-full transition-all" style={{ width: `${t.users ? (t.verified / t.users) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-surface-600">Booking-to-Meeting Ratio</span>
                <span className="font-medium text-surface-900">{t.meetings ? (t.bookings / t.meetings).toFixed(1) : 0}x</span>
              </div>
              <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(t.meetings ? (t.bookings / t.meetings) * 20 : 0, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-surface-600">Review Coverage</span>
                <span className="font-medium text-surface-900">{t.bookings ? Math.round((t.reviews / t.bookings) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent-amber rounded-full transition-all" style={{ width: `${t.bookings ? (t.reviews / t.bookings) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-surface-600">Average Rating</span>
                <span className="font-medium text-surface-900">{t.avgRating.toFixed(1)} / 5.0</span>
              </div>
              <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent-violet rounded-full transition-all" style={{ width: `${(t.avgRating / 5) * 100}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
