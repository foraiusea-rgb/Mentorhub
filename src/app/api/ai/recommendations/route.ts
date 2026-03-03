import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getRecommendations } from '@/lib/ai';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

// Strict schema for AI input
const aiRequestSchema = z.object({
  mentee: z.object({
    interests: z.array(z.string().max(100).transform(s => s.replace(/<[^>]*>/g, '').trim())).max(20).default([]),
    goals: z.string().max(500).transform(s => s.replace(/<[^>]*>/g, '').trim()).default(''),
    expertise_tags: z.array(z.string().max(100)).max(20).optional(),
    bio: z.string().max(500).transform(s => s.replace(/<[^>]*>/g, '').trim()).optional(),
  }),
  mentors: z.array(z.object({
    id: z.string().uuid(),
    full_name: z.string().max(200),
    expertise_tags: z.array(z.string().max(100)).max(20).optional(),
    bio: z.string().max(500).optional(),
    rating: z.number().min(0).max(5).optional(),
    hourly_rate: z.number().min(0).max(100000).optional(),
    total_sessions: z.number().min(0).optional(),
  })).max(50),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`ai:${ip}`, 5, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = aiRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { mentee, mentors } = parsed.data;

    if (!mentors || mentors.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const result = await getRecommendations(mentee, mentors as any);

    let recommendations;
    try {
      const parsed = JSON.parse(result);
      recommendations = parsed.recommendations || parsed;
    } catch {
      recommendations = [];
    }

    return NextResponse.json({ recommendations });
  } catch (err: any) {
    console.error('AI recommendation error:', err);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
