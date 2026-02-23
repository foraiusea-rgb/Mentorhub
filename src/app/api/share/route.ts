import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generateShareId } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`share:${ip}`, 20, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { meeting_id, title, description } = await request.json();
  const shareId = generateShareId();

  const { data, error } = await supabase.from('share_links').insert({
    share_id: shareId, mentor_id: user.id, meeting_id,
    title, description, is_active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ...data,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/schedule/${shareId}`,
  });
}
