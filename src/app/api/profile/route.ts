import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { profileSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    return NextResponse.json(data);
  }

  // List mentors
  const role = searchParams.get('role') || 'mentor';
  const expertise = searchParams.get('expertise');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  let query = supabase
    .from('profiles')
    .select('*')
    .or(`role.eq.${role},role.eq.both`)
    .order('rating', { ascending: false })
    .limit(limit);

  if (expertise) {
    query = query.contains('expertise', [expertise]);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`profile:${ip}`, 10, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = profileSchema.partial().safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
