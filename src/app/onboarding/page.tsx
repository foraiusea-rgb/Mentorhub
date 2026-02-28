'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { EXPERTISE_OPTIONS, DAYS_OF_WEEK } from '@/lib/utils';

const STEPS_MENTOR = ['welcome', 'basics', 'services', 'availability', 'done'] as const;
const STEPS_MENTEE = ['welcome', 'basics', 'interests', 'done'] as const;

const TOPIC_OPTIONS = [
  'Career Growth', 'Interview Prep', 'Resume Review', 'System Design', 'Coding Skills',
  'Leadership', 'Product Thinking', 'Data Science', 'Startup Advice', 'Work-Life Balance',
  'Public Speaking', 'Networking', 'Freelancing', 'Academic Research', 'Portfolio Review',
  'Job Search Strategy', 'Salary Negotiation', 'Management Skills', 'Technical Writing', 'Open Source',
];

export default function OnboardingPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    headline: '',
    bio: '',
    expertise_tags: [] as string[],
    hourly_rate: 0,
    currency: 'USD',
    interests: [] as string[],
    goals: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [slots, setSlots] = useState<{ day: number; start: string; end: string }[]>([]);
  const [newSlotDay, setNewSlotDay] = useState(1);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('17:00');

  const isMentor = profile?.role === 'mentor' || profile?.role === 'both';
  const steps = isMentor ? STEPS_MENTOR : STEPS_MENTEE;
  const currentStep = steps[step];
  const progress = ((step) / (steps.length - 1)) * 100;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }
    if (profile && profile.onboarding_completed) {
      router.push('/dashboard');
      return;
    }
    // If user exists but profile hasn't loaded, try fetching it directly
    if (user && !profile && !authLoading) {
      const fetchDirectly = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          // Profile exists — refreshProfile will pick it up
          refreshProfile();
        }
      };
      const timer = setTimeout(fetchDirectly, 1500);
      return () => clearTimeout(timer);
    }
    if (profile) {
      setForm((prev) => ({
        ...prev,
        full_name: profile.full_name || prev.full_name,
        headline: profile.headline || prev.headline,
        bio: profile.bio || prev.bio,
        expertise_tags: profile.expertise_tags?.length ? profile.expertise_tags : prev.expertise_tags,
        interests: profile.interests?.length ? profile.interests : prev.interests,
        goals: profile.goals || prev.goals,
        hourly_rate: profile.hourly_rate || prev.hourly_rate,
      }));
    }
  }, [authLoading, user, profile, router, supabase, refreshProfile]);

  const addSlot = () => {
    if (newSlotStart >= newSlotEnd) return;
    setSlots([...slots, { day: newSlotDay, start: newSlotStart, end: newSlotEnd }]);
  };

  const removeSlot = (i: number) => setSlots(slots.filter((_, idx) => idx !== i));

  const toggleExpertise = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      expertise_tags: prev.expertise_tags.includes(tag)
        ? prev.expertise_tags.filter((t) => t !== tag)
        : prev.expertise_tags.length < 10 ? [...prev.expertise_tags, tag] : prev.expertise_tags,
    }));
  };

  const toggleInterest = (topic: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(topic)
        ? prev.interests.filter((t) => t !== topic)
        : prev.interests.length < 10 ? [...prev.interests, topic] : prev.interests,
    }));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name, headline: form.headline, bio: form.bio,
      expertise_tags: form.expertise_tags, interests: form.interests, goals: form.goals,
      hourly_rate: form.hourly_rate, currency: form.currency, timezone: form.timezone,
      onboarding_completed: true, updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    if (isMentor && slots.length > 0) {
      await supabase.from('availability_slots').insert(
        slots.map((s) => ({ mentor_id: user.id, day_of_week: s.day, start_time: s.start, end_time: s.end }))
      );
    }

    if (!error) {
      await refreshProfile();
      router.push('/dashboard');
    }
    setSaving(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basics': return form.full_name.trim().length > 0 && (!isMentor || form.headline.trim().length > 0);
      case 'services': return form.expertise_tags.length > 0;
      case 'interests': return form.interests.length > 0;
      default: return true;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="animate-spin h-8 w-8 border-[3px] border-[var(--ink)] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Profile hasn't loaded yet — could be a timing issue, try refreshing
  if (!profile && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-[3px] border-[var(--ink)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-[var(--ink-40)]">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const inputClass = "w-full px-4 py-3 rounded-[12px] border border-[var(--ink-10)] bg-white text-[var(--ink)] text-sm placeholder:text-[var(--ink-40)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all";

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[var(--ink-10)] z-50">
        <div className="h-full bg-[var(--accent)] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Step dots */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-[var(--accent)]' : 'bg-[var(--ink-10)]'}`} />
          ))}
        </div>

        {/* === WELCOME === */}
        {currentStep === 'welcome' && (
          <div className="animate-fade-up">
            <div className="w-16 h-16 bg-[var(--accent-soft)] rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h1 className="font-display text-4xl text-[var(--ink)] mb-3">Welcome, {profile.full_name || 'there'}!</h1>
            <p className="text-lg text-[var(--ink-40)] mb-2 leading-relaxed">
              {isMentor
                ? "Let's set up your mentor profile so mentees can find and book sessions with you."
                : "Let's personalize your experience so we can match you with the right mentors."}
            </p>
            <p className="text-sm text-[var(--ink-20)]">This takes about 2 minutes. You can always update these later.</p>
          </div>
        )}

        {/* === BASICS === */}
        {currentStep === 'basics' && (
          <div className="animate-fade-up">
            <h2 className="font-display text-3xl text-[var(--ink)] mb-2">The basics</h2>
            <p className="text-[var(--ink-40)] mb-8">Tell us a bit about yourself.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Full Name</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" className={inputClass} />
              </div>
              {isMentor && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Headline</label>
                  <input type="text" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Staff Engineer at Google · 12 years in distributed systems" className={inputClass} />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">{isMentor ? 'About you (visible to mentees)' : 'About you'}</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4}
                  placeholder={isMentor ? "Share your background, what you're passionate about mentoring..." : "What are you working on? What do you hope to achieve?"}
                  className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Timezone</label>
                <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className={inputClass}>
                  {Intl.supportedValuesOf('timeZone').map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* === SERVICES (Mentor) === */}
        {currentStep === 'services' && (
          <div className="animate-fade-up">
            <h2 className="font-display text-3xl text-[var(--ink)] mb-2">Your expertise</h2>
            <p className="text-[var(--ink-40)] mb-8">What topics can you mentor on? Pick up to 10.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {EXPERTISE_OPTIONS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleExpertise(tag)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ${
                    form.expertise_tags.includes(tag) ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--ink-10)] text-[var(--ink-60)] hover:border-[var(--ink-20)]'
                  }`}>
                  {tag}{form.expertise_tags.includes(tag) && <span className="ml-1.5">×</span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--ink-40)] mb-8">{form.expertise_tags.length}/10 selected</p>
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">Hourly Rate (optional)</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-40)] text-sm">$</span>
                  <input type="number" value={form.hourly_rate || ''} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} placeholder="0" min={0}
                    className={`${inputClass} pl-8`} />
                </div>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="px-4 py-3 rounded-[12px] border border-[var(--ink-10)] bg-white text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]">
                  <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="INR">INR</option>
                </select>
              </div>
              <p className="text-xs text-[var(--ink-20)] mt-1.5">Leave at 0 to offer free sessions only.</p>
            </div>
          </div>
        )}

        {/* === AVAILABILITY (Mentor) === */}
        {currentStep === 'availability' && (
          <div className="animate-fade-up">
            <h2 className="font-display text-3xl text-[var(--ink)] mb-2">Your availability</h2>
            <p className="text-[var(--ink-40)] mb-8">Set your weekly availability. You can always change this later.</p>
            {slots.length > 0 && (
              <div className="space-y-2 mb-6">
                {slots.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 bg-white rounded-[12px] border border-[var(--ink-10)]">
                    <div>
                      <span className="text-sm font-semibold text-[var(--ink)]">{DAYS_OF_WEEK[s.day]}</span>
                      <span className="text-sm text-[var(--ink-40)] ml-2">{s.start} – {s.end}</span>
                    </div>
                    <button onClick={() => removeSlot(i)} className="text-[var(--rose)] text-sm font-medium hover:underline cursor-pointer">Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-[16px] border border-[var(--ink-10)] p-5">
              <p className="text-sm font-semibold text-[var(--ink-60)] mb-3">Add a time slot</p>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs text-[var(--ink-40)] mb-1">Day</label>
                  <select value={newSlotDay} onChange={(e) => setNewSlotDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-[10px] border border-[var(--ink-10)] bg-white text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]">
                    {DAYS_OF_WEEK.map((day, i) => <option key={i} value={i}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--ink-40)] mb-1">From</label>
                  <input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)}
                    className="px-3 py-2.5 rounded-[10px] border border-[var(--ink-10)] bg-white text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--ink-40)] mb-1">To</label>
                  <input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="px-3 py-2.5 rounded-[10px] border border-[var(--ink-10)] bg-white text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
                </div>
                <button onClick={addSlot} disabled={newSlotStart >= newSlotEnd}
                  className="px-5 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-[10px] hover:bg-[var(--ink-80)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  Add
                </button>
              </div>
            </div>
            {slots.length === 0 && <p className="text-xs text-[var(--ink-20)] mt-3">You can skip this and set availability later from your calendar.</p>}
          </div>
        )}

        {/* === INTERESTS (Mentee) === */}
        {currentStep === 'interests' && (
          <div className="animate-fade-up">
            <h2 className="font-display text-3xl text-[var(--ink)] mb-2">What are you interested in?</h2>
            <p className="text-[var(--ink-40)] mb-8">Pick the topics you'd like mentorship on. This helps us match you with the right mentors.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {TOPIC_OPTIONS.map((topic) => (
                <button key={topic} type="button" onClick={() => toggleInterest(topic)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ${
                    form.interests.includes(topic) ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--ink-10)] text-[var(--ink-60)] hover:border-[var(--ink-20)]'
                  }`}>
                  {topic}{form.interests.includes(topic) && <span className="ml-1.5">×</span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--ink-40)] mb-6">{form.interests.length}/10 selected</p>
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-60)] mb-1.5">What are your goals? (optional)</label>
              <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={3}
                placeholder="e.g. I want to transition from backend to full-stack, prepare for senior engineer interviews..."
                className={`${inputClass} resize-none`} />
            </div>
          </div>
        )}

        {/* === DONE === */}
        {currentStep === 'done' && (
          <div className="animate-fade-up text-center py-8">
            <div className="w-20 h-20 bg-[var(--emerald-soft)] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[var(--emerald)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-display text-3xl text-[var(--ink)] mb-3">You're all set!</h2>
            <p className="text-[var(--ink-40)] mb-8 max-w-md mx-auto">
              {isMentor ? "Your mentor profile is ready. Mentees can now discover you and book sessions." : "Your profile is ready. Start exploring mentors and booking sessions."}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--ink-05)]">
          <button onClick={() => setStep(Math.max(0, step - 1))}
            className={`text-sm font-medium text-[var(--ink-40)] hover:text-[var(--ink)] transition-colors cursor-pointer ${step === 0 ? 'invisible' : ''}`}>
            ← Back
          </button>
          {currentStep === 'done' ? (
            <button onClick={handleFinish} disabled={saving}
              className="px-8 py-3 bg-[var(--accent)] text-white text-sm font-semibold rounded-[12px] hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2">
              {saving ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
              ) : 'Go to Dashboard →'}
            </button>
          ) : (
            <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={!canProceed()}
              className="px-8 py-3 bg-[var(--ink)] text-white text-sm font-semibold rounded-[12px] hover:bg-[var(--ink-80)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
