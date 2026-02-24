'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

/* ──────────────────────────── Data ──────────────────────────── */

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'AI-Powered Matching',
    description: 'Our algorithm analyzes goals, skills, and personality to connect you with the mentor who will actually move the needle.',
    iconBg: 'bg-[var(--violet-soft)]',
    iconColor: 'text-[var(--violet)]',
    tag: 'ai-powered',
    tagColor: 'bg-[var(--violet-soft)] text-[var(--violet)]',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: 'Smart Scheduling',
    description: 'Share a link. Participants pick their time. AI optimizes for maximum attendance. No more back-and-forth emails.',
    iconBg: 'bg-[var(--accent-soft)]',
    iconColor: 'text-[var(--accent)]',
    tag: 'zero-friction',
    tagColor: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    title: 'Seamless Payments',
    description: 'Stripe-powered payments for paid sessions. Free sessions need zero setup. Mentors get paid directly to their account.',
    iconBg: 'bg-[var(--emerald-soft)]',
    iconColor: 'text-[var(--emerald)]',
    tag: 'stripe-secured',
    tagColor: 'bg-[var(--emerald-soft)] text-[var(--emerald)]',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: '1:1 & Group Sessions',
    description: 'Intimate one-on-one mentoring or scalable group workshops. Switch between formats with a single toggle.',
    iconBg: 'bg-[var(--amber-soft)]',
    iconColor: 'text-[var(--amber)]',
    tag: 'flexible',
    tagColor: 'bg-[var(--amber-soft)] text-[var(--amber)]',
  },
];

const STATS = [
  { value: '10K+', label: 'Active Mentors' },
  { value: '50K+', label: 'Sessions Held' },
  { value: '4.9/5', label: 'Average Rating' },
  { value: '120+', label: 'Countries' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Senior Engineer, Stripe',
    text: 'MentorHub connected me with a VP of Engineering who completely transformed how I think about technical leadership.',
    initials: 'SC',
    color: 'bg-[var(--violet)]',
  },
  {
    name: 'Marcus Johnson',
    role: 'Product Designer',
    text: 'The AI matching is genuinely impressive. First recommendation was a perfect fit — saved me weeks of searching.',
    initials: 'MJ',
    color: 'bg-[var(--accent)]',
  },
  {
    name: 'Priya Patel',
    role: 'Startup Founder',
    text: 'Running group mentoring sessions for my accelerator cohort is effortless. The scheduling alone saves hours every week.',
    initials: 'PP',
    color: 'bg-[var(--emerald)]',
  },
];

const STEPS = [
  { num: '01', title: 'Tell us your goals', desc: 'Share what you want to learn, where you are today, and where you want to be.' },
  { num: '02', title: 'Get matched by AI', desc: 'Our algorithm finds mentors whose expertise aligns precisely with your needs.' },
  { num: '03', title: 'Book & grow', desc: 'Schedule sessions, join calls, and track your progress — all in one place.' },
];

const TRUST_LOGOS = ['Google', 'Stripe', 'Meta', 'Shopify', 'Figma', 'Notion', 'Vercel', 'Linear'];

/* ──────────────────────────── Hook ──────────────────────────── */

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ──────────────────────────── Page ──────────────────────────── */

export default function HomePage() {
  const hero = useInView(0.1);
  const stats = useInView();
  const features = useInView();
  const steps = useInView();
  const testimonials = useInView();
  const cta = useInView();

  return (
    <div className="relative bg-[var(--cream)]">

      {/* ═══ HERO ═══ */}
      <section ref={hero.ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[72px] pb-20 px-6">
        {/* Ambient orbs */}
        <div className="absolute top-[10%] right-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08), transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06), transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(5,150,105,0.04), transparent 70%)', filter: 'blur(80px)' }} />
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(var(--ink-10) 1px, transparent 1px), linear-gradient(90deg, var(--ink-10) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%, black 20%, transparent 70%)',
          }}
        />

        <div className="relative text-center max-w-[900px] mx-auto">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-[18px] py-2 bg-white border border-[var(--ink-10)] rounded-full text-[13px] font-semibold text-[var(--ink-60)] shadow-sm mb-8 transition-all duration-1000 ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-[var(--emerald)] animate-ping opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-[var(--emerald)]" />
            </span>
            Powered by AI matching
          </div>

          {/* Headline */}
          <h1
            className={`font-display text-[clamp(48px,7vw,88px)] leading-[1.05] tracking-tight text-[var(--ink)] mb-6 transition-all duration-1000 delay-150 ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            Find the mentor<br />who <em className="italic bg-gradient-to-r from-[var(--accent)] to-[var(--violet)] bg-clip-text text-transparent">changes everything</em>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-[clamp(16px,2vw,20px)] leading-relaxed text-[var(--ink-40)] max-w-[560px] mx-auto mb-10 font-light transition-all duration-1000 delay-300 ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            Connect with world-class mentors, book sessions in seconds, and accelerate your career — powered by AI that understands what you actually need.
          </p>

          {/* CTAs */}
          <div
            className={`flex items-center justify-center gap-4 flex-wrap transition-all duration-1000 delay-[450ms] ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <Link
              href="/auth?tab=signup"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-[var(--ink)] text-white rounded-[14px] text-[15px] font-semibold shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:bg-[var(--ink-80)] transition-all duration-300"
            >
              Start free today
              <svg className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 text-[var(--ink-60)] rounded-[14px] text-[15px] font-semibold border-[1.5px] border-[var(--ink-20)] hover:border-[var(--ink-40)] hover:text-[var(--ink)] transition-all duration-300"
            >
              Browse mentors
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <div className="relative py-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-[120px] h-full bg-gradient-to-r from-[var(--cream)] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[120px] h-full bg-gradient-to-l from-[var(--cream)] to-transparent z-10 pointer-events-none" />
        <p className="text-center text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--ink-20)] mb-6">Trusted by professionals at</p>
        <div className="overflow-hidden">
          <div className="flex animate-[marquee_30s_linear_infinite] w-max">
            {[...TRUST_LOGOS, ...TRUST_LOGOS].map((name, i) => (
              <span key={i} className="flex-shrink-0 px-10 font-display text-2xl text-[var(--ink-20)] whitespace-nowrap">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <div ref={stats.ref} className="px-6 pb-20">
        <div className="max-w-[900px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--ink-10)] rounded-[20px] overflow-hidden">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`bg-white py-8 px-6 text-center transition-all duration-700 ${stats.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="font-display text-4xl text-[var(--ink)] leading-none mb-1.5">{s.value}</div>
              <div className="text-[13px] font-medium text-[var(--ink-40)]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <section ref={features.ref} className="py-24 px-6 bg-white">
        <div className="max-w-[600px] mx-auto text-center mb-16">
          <div className={`transition-all duration-700 ${features.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--accent)] mb-4 flex items-center justify-center gap-2">
              <span className="w-5 h-px bg-[var(--accent)] opacity-40" />
              Features
              <span className="w-5 h-px bg-[var(--accent)] opacity-40" />
            </p>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-[var(--ink)] mb-4">
              Everything you need<br />to grow faster
            </h2>
            <p className="text-[17px] text-[var(--ink-40)] leading-relaxed">Built for mentors and mentees who value their time.</p>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`p-10 rounded-[20px] border border-[var(--ink-10)] bg-[var(--cream)] hover:border-[var(--ink-20)] hover:-translate-y-1 hover:shadow-xl transition-all duration-500 ${features.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${150 + i * 100}ms` }}
            >
              <div className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-5 ${f.iconBg} ${f.iconColor}`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] mb-2.5 tracking-tight">{f.title}</h3>
              <p className="text-[15px] text-[var(--ink-40)] leading-relaxed">{f.description}</p>
              <span className={`inline-block mt-4 px-3 py-1 rounded-lg text-[12px] font-semibold font-mono tracking-wide ${f.tagColor}`}>
                {f.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section ref={steps.ref} className="py-24 px-6 bg-[var(--ink)] text-white relative overflow-hidden">
        <div className="max-w-[600px] mx-auto text-center mb-16">
          <div className={`transition-all duration-700 ${steps.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-white/50 mb-4">How it works</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-white">
              Three steps to your<br />next breakthrough
            </h2>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto grid md:grid-cols-3 gap-10 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`text-center transition-all duration-700 ${steps.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${150 + i * 120}ms` }}
            >
              <div className="w-14 h-14 rounded-full bg-white/[0.08] border border-white/[0.12] backdrop-blur-sm flex items-center justify-center font-mono text-base font-semibold text-[var(--accent)] mx-auto mb-6 relative z-10">
                {s.num}
              </div>
              <h3 className="text-xl font-bold mb-2.5">{s.title}</h3>
              <p className="text-[15px] text-white/50 leading-relaxed max-w-[260px] mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section ref={testimonials.ref} className="py-24 px-6 bg-[var(--cream)]">
        <div className="max-w-[600px] mx-auto text-center mb-16">
          <div className={`transition-all duration-700 ${testimonials.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--accent)] mb-4 flex items-center justify-center gap-2">
              <span className="w-5 h-px bg-[var(--accent)] opacity-40" />
              Testimonials
              <span className="w-5 h-px bg-[var(--accent)] opacity-40" />
            </p>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-[var(--ink)]">
              Loved by professionals<br />everywhere
            </h2>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`p-9 bg-white rounded-[20px] border border-[var(--ink-10)] flex flex-col hover:-translate-y-1 hover:shadow-xl hover:border-[var(--ink-20)] transition-all duration-500 ${testimonials.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${150 + i * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-[18px] h-[18px] text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-[var(--ink-60)] flex-1 mb-6">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 pt-5 border-t border-[var(--ink-05)]">
                <div className={`w-10 h-10 rounded-[12px] ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--ink)]">{t.name}</div>
                  <div className="text-[13px] text-[var(--ink-40)]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-6 bg-white">
        <div
          ref={cta.ref}
          className={`max-w-[900px] mx-auto bg-[var(--ink)] rounded-[32px] px-8 py-16 sm:px-16 sm:py-20 text-center relative overflow-hidden transition-all duration-700 ${cta.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Orbs */}
          <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.2), transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-[-30%] left-[-10%] w-[350px] h-[350px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)', filter: 'blur(60px)' }} />

          <h2 className="relative font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-tight text-white mb-4">
            Ready to find your<br />perfect mentor?
          </h2>
          <p className="relative text-[17px] text-white/50 max-w-[480px] mx-auto mb-10 leading-relaxed">
            Join thousands of professionals who accelerated their career on MentorHub. It takes 30 seconds.
          </p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth?tab=signup"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-[var(--ink)] rounded-[14px] text-[15px] font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Get started free
              <svg className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 text-white/60 rounded-[14px] text-[15px] font-semibold border-[1.5px] border-white/15 hover:border-white/30 hover:text-white transition-all duration-300"
            >
              Browse mentors
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[var(--ink-10)] bg-[var(--cream)] py-16 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-[var(--ink)] rounded-[10px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <span className="font-display text-lg text-[var(--ink)]">MentorHub</span>
              </div>
              <p className="text-sm text-[var(--ink-40)] leading-relaxed max-w-[280px]">
                The AI-powered platform connecting you with mentors who move the needle.
              </p>
            </div>

            {/* Links */}
            {[
              { title: 'Product', links: [{ label: 'Explore', href: '/explore' }, { label: 'AI Matching', href: '/ai/recommendations' }, { label: 'Create Meeting', href: '/meetings/create' }, { label: 'Calendar', href: '/calendar' }] },
              { title: 'Resources', links: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Payments', href: '/payments' }, { label: 'Admin', href: '/admin' }] },
              { title: 'Account', links: [{ label: 'Sign In', href: '/auth' }, { label: 'Create Account', href: '/auth?tab=signup' }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--ink-40)] mb-4">{col.title}</h4>
                <div className="space-y-2.5">
                  {col.links.map((l) => (
                    <Link key={l.label} href={l.href} className="block text-sm text-[var(--ink-60)] hover:text-[var(--ink)] transition-colors">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-[var(--ink-10)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[var(--ink-40)]">&copy; {new Date().getFullYear()} MentorHub. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="text-[13px] text-[var(--ink-40)] hover:text-[var(--ink-60)] transition-colors cursor-pointer">Privacy</span>
              <span className="text-[13px] text-[var(--ink-40)] hover:text-[var(--ink-60)] transition-colors cursor-pointer">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
