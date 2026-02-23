import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { optimizeSlots } from '@/lib/ai';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`ai-avail:${ip}`, 5, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { mentor_availability, participant_preferences, duration } = await request.json();

    const result = await optimizeSlots(
      mentor_availability,
      participant_preferences,
      duration || 60
    );

    let suggestions;
    try {
      const parsed = JSON.parse(result);
      suggestions = parsed.suggestions || parsed;
    } catch {
      suggestions = [];
    }

    return NextResponse.json({ suggestions });
  } catch (err: any) {
    console.error('AI availability error:', err);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
