'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, Button } from '@/components/ui';
import { NotificationBell } from '@/components/layout/NotificationBell';

export function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-surface-900">MentorHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/explore" className="px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 rounded-lg hover:bg-surface-50 transition-colors">Explore</Link>
            <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 rounded-lg hover:bg-surface-50 transition-colors">Dashboard</Link>
            <Link href="/meetings/create" className="px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 rounded-lg hover:bg-surface-50 transition-colors">Create Meeting</Link>
            <Link href="/calendar" className="px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 rounded-lg hover:bg-surface-50 transition-colors">Calendar</Link>
            <Link href="/ai/recommendations" className="px-3 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 rounded-lg hover:bg-brand-50 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              AI Match
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-surface-100 animate-pulse" />
            ) : user && profile ? (
              <>
                <NotificationBell />
                <div className="relative">
                  <button onClick={() => setProfileMenu(!profileMenu)} className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-50 transition-colors">
                    <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-surface-700 max-w-[120px] truncate">{profile.full_name}</span>
                    <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {profileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-elevated border border-surface-100 py-2 z-50 animate-scale-in">
                        <div className="px-4 py-2 border-b border-surface-100">
                          <p className="text-sm font-medium text-surface-900 truncate">{profile.full_name}</p>
                          <p className="text-xs text-surface-500 truncate">{profile.email}</p>
                        </div>
                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50" onClick={() => setProfileMenu(false)}>Dashboard</Link>
                        <Link href={`/profile/${profile.id}`} className="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50" onClick={() => setProfileMenu(false)}>My Profile</Link>
                        <Link href="/payments" className="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50" onClick={() => setProfileMenu(false)}>Payments</Link>
                        <Link href="/calendar" className="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50" onClick={() => setProfileMenu(false)}>Calendar</Link>
                        <Link href="/admin" className="block px-4 py-2 text-sm text-accent-violet hover:bg-purple-50" onClick={() => setProfileMenu(false)}>⚙️ Admin</Link>
                        <hr className="my-1 border-surface-100" />
                        <button onClick={() => { signOut(); setProfileMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-accent-rose hover:bg-red-50">Sign Out</button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth"><Button variant="ghost" size="sm">Log In</Button></Link>
                <Link href="/auth?tab=signup"><Button size="sm">Get Started</Button></Link>
              </div>
            )}
            <button className="md:hidden p-2 text-surface-600" onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-surface-100 py-4 space-y-1 animate-slide-up">
            <Link href="/explore" className="block px-3 py-2 text-sm rounded-lg hover:bg-surface-50" onClick={() => setMenuOpen(false)}>Explore</Link>
            <Link href="/dashboard" className="block px-3 py-2 text-sm rounded-lg hover:bg-surface-50" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link href="/meetings/create" className="block px-3 py-2 text-sm rounded-lg hover:bg-surface-50" onClick={() => setMenuOpen(false)}>Create Meeting</Link>
            <Link href="/calendar" className="block px-3 py-2 text-sm rounded-lg hover:bg-surface-50" onClick={() => setMenuOpen(false)}>Calendar</Link>
            <Link href="/ai/recommendations" className="block px-3 py-2 text-sm text-brand-600 rounded-lg hover:bg-brand-50" onClick={() => setMenuOpen(false)}>AI Match</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
