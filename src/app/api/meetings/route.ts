import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { meetingSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);
  const mentorId = searchParams.get('mentor_id');

  let query = supabase
    .from('meetings')
    .select('*, mentor:profiles(*), slots:meeting_slots(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (mentorId) query = query.eq('mentor_id', mentorId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`meetings:${ip}`, 20, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = meetingSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from('meetings')
    .insert({ ...result.data, mentor_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
