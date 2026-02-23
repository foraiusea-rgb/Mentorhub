'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { Avatar, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  Menu, X, Home, Calendar, Users, Video, User, Settings,
  LogOut, Plus, Sparkles, LayoutDashboard, ChevronDown
} from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: '/meetings', label: 'Explore', icon: Video },
    { href: '/mentors', label: 'Mentors', icon: Users },
  ];

  const authedLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/meetings/create', label: 'Create', icon: Plus },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-surface-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-surface-900 to-surface-600 bg-clip-text text-transparent font-display">
              MentorHub
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-500 hover:text-surface-800 hover:bg-surface-50'
                )}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
            {user && authedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-500 hover:text-surface-800 hover:bg-surface-50'
                )}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-50 transition-colors"
                >
                  <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-surface-700">{user.full_name.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-surface-400" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-surface-100 py-2 z-20 animate-fade-in">
                      <div className="px-4 py-2 border-b border-surface-100">
                        <p className="text-sm font-medium text-surface-900">{user.full_name}</p>
                        <p className="text-xs text-surface-500">{user.email}</p>
                      </div>
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors" onClick={() => setProfileOpen(false)}>
                        <User size={16} /> Profile
                      </Link>
                      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors" onClick={() => setProfileOpen(false)}>
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                      <Link href="/profile/availability" className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors" onClick={() => setProfileOpen(false)}>
                        <Calendar size={16} /> Availability
                      </Link>
                      <hr className="my-1 border-surface-100" />
                      <button
                        onClick={() => { signOut(); setProfileOpen(false); router.push('/'); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-accent-rose hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/auth?tab=signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-surface-100 text-surface-600"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-100 bg-white animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {[...navLinks, ...(user ? authedLinks : [])].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  pathname === link.href ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-50'
                )}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-surface-100 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-surface-900 font-display">MentorHub</span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed">
              Connect with mentors, grow your skills, and advance your career through meaningful mentorship.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Platform</h4>
            <div className="space-y-2">
              <Link href="/meetings" className="block text-sm text-surface-500 hover:text-brand-600 transition-colors">Explore Meetings</Link>
              <Link href="/mentors" className="block text-sm text-surface-500 hover:text-brand-600 transition-colors">Find Mentors</Link>
              <Link href="/auth?tab=signup" className="block text-sm text-surface-500 hover:text-brand-600 transition-colors">Become a Mentor</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Resources</h4>
            <div className="space-y-2">
              <span className="block text-sm text-surface-500">Help Center</span>
              <span className="block text-sm text-surface-500">Privacy Policy</span>
              <span className="block text-sm text-surface-500">Terms of Service</span>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-surface-200 text-center text-sm text-surface-400">
          &copy; {new Date().getFullYear()} MentorHub. Built with purpose.
        </div>
      </div>
    </footer>
  );
}
