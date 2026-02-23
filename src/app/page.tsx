'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Avatar, StarRating, Badge } from '@/components/ui';

const FEATURES = [
  {
    icon: '🎯',
    title: 'AI-Powered Matching',
    description: 'Our AI analyzes your goals, skills, and preferences to recommend the perfect mentor for your journey.',
  },
  {
    icon: '📅',
    title: 'Smart Scheduling',
    description: 'Share a link, let participants pick their times. AI optimizes slots for maximum attendance.',
  },
  {
    icon: '💳',
    title: 'Seamless Payments',
    description: 'Stripe-powered payments for paid sessions. Free sessions need zero setup. Simple.',
  },
  {
    icon: '👥',
    title: '1:1 & Group Sessions',
    description: 'Intimate one-on-one mentoring or scalable group workshops — your choice.',
  },
  {
    icon: '🔗',
    title: 'No-Install Sharing',
    description: 'Generate a link, drop it in any chat. Participants respond instantly — no app required.',
  },
  {
    icon: '🛡️',
    title: 'Enterprise Security',
    description: 'Row-level security, encrypted payments, CSRF protection, and rate limiting built-in.',
  },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Senior Engineer @ Stripe', avatar: null, text: 'MentorHub helped me find a VP of Engineering mentor who transformed my leadership approach.', rating: 5 },
  { name: 'Marcus Johnson', role: 'Product Designer', avatar: null, text: 'The AI matching is incredible. It connected me with a mentor who had the exact expertise I needed.', rating: 5 },
  { name: 'Priya Patel', role: 'Startup Founder', avatar: null, text: 'Running group mentoring sessions for my accelerator cohort has never been easier.', rating: 5 },
];

const STATS = [
  { value: '10,000+', label: 'Active Mentors' },
  { value: '50,000+', label: 'Sessions Completed' },
  { value: '4.9/5', label: 'Average Rating' },
  { value: '120+', label: 'Countries' },
];

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 pattern-dots opacity-40" />
        <div
          className="absolute top-20 -right-40 w-[600px] h-[600px] bg-brand-200/30 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute -bottom-20 -left-40 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-fade-in">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI-Powered Mentorship Platform
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-surface-950 leading-[1.1] mb-6 animate-slide-up">
                Find Your
                <br />
                <span className="gradient-text">Perfect Mentor</span>
              </h1>

              <p className="text-lg text-surface-600 max-w-xl mb-8 animate-slide-up animate-delay-100">
                Connect with industry experts, schedule seamless sessions, and accelerate your career growth. AI matches you with mentors who truly understand your goals.
              </p>

              <div className="flex flex-wrap gap-3 animate-slide-up animate-delay-200">
                <Link href="/auth?tab=signup">
                  <Button size="lg">
                    Start Free
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/auth?tab=signup&role=mentor">
                  <Button variant="outline" size="lg">Become a Mentor</Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10 animate-slide-up animate-delay-300">
                <div className="flex -space-x-3">
                  {['S', 'M', 'P', 'A', 'J'].map((initial, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white">
                      {initial}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <StarRating rating={5} />
                    <span className="text-sm font-medium text-surface-900 ml-1">4.9/5</span>
                  </div>
                  <p className="text-sm text-surface-500">from 2,000+ reviews</p>
                </div>
              </div>
            </div>

            {/* Hero Visual — Meeting Card Preview */}
            <div className="hidden lg:block animate-slide-up animate-delay-200">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-brand-200/40 to-accent-violet/20 rounded-3xl blur-2xl" />
                <Card className="relative !p-8 !rounded-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg">
                      JD
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900">System Design Masterclass</h3>
                      <p className="text-sm text-surface-500">with Jane Doe • Principal Engineer @ Google</p>
                    </div>
                    <Badge variant="success" className="ml-auto">Live</Badge>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-surface-600">
                      <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      60 min • Online
                    </div>
                    <div className="flex items-center gap-3 text-sm text-surface-600">
                      <svg className="w-4 h-4 text-accent-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Group Session • 12/20 spots
                    </div>
                    <div className="flex items-center gap-3 text-sm text-surface-600">
                      <svg className="w-4 h-4 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      $49 per session
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {['Mon 10am', 'Wed 2pm', 'Fri 11am'].map((slot) => (
                      <button key={slot} className="px-3 py-2 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors">
                        {slot}
                      </button>
                    ))}
                  </div>
                  <Button className="w-full" size="lg">Book Session</Button>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 border-y border-surface-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl sm:text-4xl font-bold text-surface-900">{stat.value}</div>
                <div className="text-sm text-surface-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="brand" className="mb-4">Features</Badge>
            <h2 className="font-display text-4xl font-bold text-surface-900 mb-4">Everything you need to grow</h2>
            <p className="text-surface-600 max-w-2xl mx-auto">A complete platform for mentors and mentees with intelligent scheduling, secure payments, and AI-powered recommendations.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <Card key={feature.title} hover className="group">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2 group-hover:text-brand-600 transition-colors">{feature.title}</h3>
                <p className="text-sm text-surface-600 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-surface-50 relative">
        <div className="absolute inset-0 pattern-grid opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="brand" className="mb-4">How It Works</Badge>
            <h2 className="font-display text-4xl font-bold text-surface-900 mb-4">Three steps to get started</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up as a mentor or mentee. Add your expertise, credentials, and availability.' },
              { step: '02', title: 'Find & Schedule', desc: 'Browse mentors or let AI match you. Pick a slot that works and book instantly.' },
              { step: '03', title: 'Meet & Grow', desc: 'Join online or in-person sessions. Leave reviews and track your progress.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-7xl font-display font-bold text-brand-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-surface-900 mb-2">{item.title}</h3>
                <p className="text-surface-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="brand" className="mb-4">Testimonials</Badge>
            <h2 className="font-display text-4xl font-bold text-surface-900">Loved by thousands</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="!p-8">
                <StarRating rating={t.rating} />
                <p className="mt-4 text-surface-700 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-surface-100">
                  <Avatar name={t.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{t.name}</p>
                    <p className="text-xs text-surface-500">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800" />
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">Ready to accelerate your growth?</h2>
          <p className="text-brand-100 text-lg mb-8">Join thousands of professionals who are leveling up with expert mentorship.</p>
          <div className="flex justify-center gap-3">
            <Link href="/auth?tab=signup">
              <Button size="lg" className="!bg-white !text-brand-700 hover:!bg-brand-50">Get Started Free</Button>
            </Link>
            <Link href="/auth?tab=signup&role=mentor">
              <Button size="lg" variant="outline" className="!border-white/30 !text-white hover:!bg-white/10">Apply as Mentor</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-950 text-surface-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                  </svg>
                </div>
                <span className="font-display text-lg font-bold text-white">MentorHub</span>
              </div>
              <p className="text-sm">AI-powered mentorship platform connecting experts with learners worldwide.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth" className="hover:text-white transition-colors">Find a Mentor</Link></li>
                <li><Link href="/auth?role=mentor" className="hover:text-white transition-colors">Become a Mentor</Link></li>
                <li><Link href="/ai/recommendations" className="hover:text-white transition-colors">AI Matching</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-surface-800 pt-8 text-sm text-center">
            &copy; {new Date().getFullYear()} MentorHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
