import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getRecommendations } from '@/lib/ai';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`ai:${ip}`, 5, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { mentee, mentors } = await request.json();

    if (!mentors || mentors.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const result = await getRecommendations(mentee, mentors);

    // Parse AI response
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
    return NextResponse.json({ error: 'AI service error', details: err.message }, { status: 500 });
  }
}
