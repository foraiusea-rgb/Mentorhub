'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<'login' | 'signup'>((searchParams.get('tab') as 'login' | 'signup') || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>(searchParams.get('role') || 'mentee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Check onboarding status
    try {
      const userId = data.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', userId)
          .single();
        if (profile && !profile.onboarding_completed) {
          router.push('/onboarding');
          return;
        }
      }
    } catch {}
    router.push(searchParams.get('redirect') || '/dashboard');
  };
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); }
    else { setMessage('Check your email for a confirmation link!'); }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-[45%] bg-[var(--ink)] relative overflow-hidden items-center justify-center p-12">
        {/* Ambient orbs */}
        <div className="absolute top-[-10%] right-[-20%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.2), transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-15%] left-[-15%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)', filter: 'blur(60px)' }} />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative text-center max-w-md">
          <div className="w-16 h-16 bg-white/10 rounded-[18px] flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/10">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h2 className="font-display text-4xl text-white mb-4 leading-tight">
            Your next<br /><em className="italic text-blue-300">breakthrough</em><br />starts here
          </h2>
          <p className="text-white/40 text-base leading-relaxed">
            Join 10,000+ professionals who found their perfect mentor on MentorHub.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            {[
              { value: '10K+', label: 'Mentors' },
              { value: '4.9/5', label: 'Rating' },
              { value: '120+', label: 'Countries' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl text-white">{s.value}</div>
                <div className="text-xs text-white/30 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--cream)]">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 lg:mb-12">
            <div className="w-9 h-9 bg-[var(--ink)] rounded-[10px] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <span className="font-display text-xl text-[var(--ink)]">MentorHub</span>
          </Link>

          <h1 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-[15px] text-[var(--ink-40)] mb-8">
            {tab === 'login' ? 'Sign in to continue to your dashboard.' : 'Start your mentorship journey today.'}
          </p>

          {/* OAuth */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-[var(--ink-10)] rounded-[12px] text-sm font-medium text-[var(--ink-60)] hover:border-[var(--ink-20)] hover:text-[var(--ink)] hover:shadow-sm transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth('github')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-[var(--ink-10)] rounded-[12px] text-sm font-medium text-[var(--ink-60)] hover:border-[var(--ink-20)] hover:text-[var(--ink)] hover:shadow-sm transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--ink-10)]" />
            <span className="text-[12px] font-semibold text-[var(--ink-20)] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[var(--ink-10)]" />
          </div>

          {/* Tabs */}
          <div className="flex bg-[var(--ink-05)] rounded-[10px] p-1 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-[8px] transition-all duration-200 ${tab === 'login' ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--ink-40)]'}`}
            >
              Log In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-[8px] transition-all duration-200 ${tab === 'signup' ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--ink-40)]'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-[12px] mb-4">
              <svg className="w-5 h-5 text-[var(--rose)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              <span className="text-sm text-[var(--rose)]">{error}</span>
            </div>
          )}
          {message && (
            <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-[12px] mb-4">
              <svg className="w-5 h-5 text-[var(--emerald)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm text-[var(--emerald)]">{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {tab === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-[12px] border border-[var(--ink-10)] bg-white text-[var(--ink)] text-sm placeholder:text-[var(--ink-40)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-60)] mb-2">I want to be a</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: 'mentee', emoji: '🎓', l: 'Mentee' },
                      { v: 'mentor', emoji: '🧑‍🏫', l: 'Mentor' },
                      { v: 'both', emoji: '🔄', l: 'Both' },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setRole(opt.v)}
                        className={`py-3 px-3 rounded-[12px] text-sm font-semibold border-2 transition-all duration-200 ${
                          role === opt.v
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                            : 'border-[var(--ink-10)] text-[var(--ink-60)] hover:border-[var(--ink-20)]'
                        }`}
                      >
                        <span className="text-lg block mb-0.5">{opt.emoji}</span>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-[12px] border border-[var(--ink-10)] bg-white text-[var(--ink)] text-sm placeholder:text-[var(--ink-40)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-[12px] border border-[var(--ink-10)] bg-white text-[var(--ink)] text-sm placeholder:text-[var(--ink-40)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--ink)] text-white rounded-[14px] text-[15px] font-semibold hover:bg-[var(--ink-80)] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[var(--ink-40)] mt-6">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
              className="text-[var(--accent)] font-semibold hover:underline"
            >
              {tab === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="animate-spin h-8 w-8 border-[3px] border-[var(--ink)] border-t-transparent rounded-full" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
