'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, Button } from '@/components/ui';
import { NotificationBell } from '@/components/layout/NotificationBell';

export function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 transition-all duration-400 ${
        scrolled
          ? 'bg-[var(--cream)]/85 backdrop-blur-xl backdrop-saturate-150'
          : 'bg-transparent'
      }`}
    >
      <div
        className={`max-w-[1200px] mx-auto flex items-center justify-between h-[72px] transition-all duration-400 ${
          scrolled ? 'border-b border-[var(--ink-10)]' : 'border-b border-transparent'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[var(--ink)] rounded-[10px] flex items-center justify-center transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <span className="font-display text-[22px] tracking-tight text-[var(--ink)]">MentorHub</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/explore" className="px-4 py-2 text-sm font-medium text-[var(--ink-60)] hover:text-[var(--ink)] rounded-[10px] hover:bg-[var(--ink-05)] transition-all duration-200">
            Explore
          </Link>
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-[var(--ink-60)] hover:text-[var(--ink)] rounded-[10px] hover:bg-[var(--ink-05)] transition-all duration-200">
            Dashboard
          </Link>
          <Link href="/ai/recommendations" className="px-4 py-2 text-sm font-medium text-[var(--ink-60)] hover:text-[var(--ink)] rounded-[10px] hover:bg-[var(--ink-05)] transition-all duration-200">
            AI Match
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[var(--ink-05)] animate-pulse" />
          ) : user && profile ? (
            <>
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setProfileMenu(!profileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-[10px] hover:bg-[var(--ink-05)] transition-colors"
                >
                  <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-[var(--ink-60)] max-w-[120px] truncate">
                    {profile.full_name}
                  </span>
                  <svg className="w-4 h-4 text-[var(--ink-40)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {profileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[16px] shadow-elevated border border-[var(--ink-10)] py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2.5 border-b border-[var(--ink-05)]">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">{profile.full_name}</p>
                        <p className="text-xs text-[var(--ink-40)] truncate">{profile.email}</p>
                      </div>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-[var(--ink-60)] hover:bg-[var(--ink-05)] hover:text-[var(--ink)] transition-colors" onClick={() => setProfileMenu(false)}>Dashboard</Link>
                      <Link href={`/profile/${profile.id}`} className="block px-4 py-2 text-sm text-[var(--ink-60)] hover:bg-[var(--ink-05)] hover:text-[var(--ink)] transition-colors" onClick={() => setProfileMenu(false)}>My Profile</Link>
                      <Link href="/payments" className="block px-4 py-2 text-sm text-[var(--ink-60)] hover:bg-[var(--ink-05)] hover:text-[var(--ink)] transition-colors" onClick={() => setProfileMenu(false)}>Payments</Link>
                      <Link href="/calendar" className="block px-4 py-2 text-sm text-[var(--ink-60)] hover:bg-[var(--ink-05)] hover:text-[var(--ink)] transition-colors" onClick={() => setProfileMenu(false)}>Calendar</Link>
                      <Link href="/admin" className="block px-4 py-2 text-sm text-[var(--violet)] hover:bg-[var(--violet-soft)] transition-colors" onClick={() => setProfileMenu(false)}>Admin</Link>
                      <hr className="my-1 border-[var(--ink-05)]" />
                      <button
                        onClick={() => { signOut(); setProfileMenu(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-[var(--rose)] hover:bg-[var(--rose-soft)] transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth" className="px-4 py-2 text-sm font-medium text-[var(--ink-60)] hover:text-[var(--ink)] transition-colors">
                Log in
              </Link>
              <Link
                href="/auth?tab=signup"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-[12px] hover:bg-[var(--ink-80)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                Get started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-[var(--ink-60)]" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--ink-10)] py-4 space-y-1 animate-slide-up bg-white/95 backdrop-blur-xl">
          <Link href="/explore" className="block px-4 py-2.5 text-sm font-medium text-[var(--ink-60)] rounded-[10px] hover:bg-[var(--ink-05)]" onClick={() => setMenuOpen(false)}>Explore</Link>
          <Link href="/dashboard" className="block px-4 py-2.5 text-sm font-medium text-[var(--ink-60)] rounded-[10px] hover:bg-[var(--ink-05)]" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link href="/ai/recommendations" className="block px-4 py-2.5 text-sm font-medium text-[var(--ink-60)] rounded-[10px] hover:bg-[var(--ink-05)]" onClick={() => setMenuOpen(false)}>AI Match</Link>
          <Link href="/calendar" className="block px-4 py-2.5 text-sm font-medium text-[var(--ink-60)] rounded-[10px] hover:bg-[var(--ink-05)]" onClick={() => setMenuOpen(false)}>Calendar</Link>
        </div>
      )}
    </nav>
  );
}
