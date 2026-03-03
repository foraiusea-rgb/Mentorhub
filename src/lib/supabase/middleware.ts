import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function secureCookieOptions(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const secure = secureCookieOptions(options);
          request.cookies.set({ name, value, ...secure });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...secure });
        },
        remove(name: string, options: CookieOptions) {
          const secure = secureCookieOptions({ ...options, maxAge: 0 });
          request.cookies.set({ name, value: '', ...secure });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...secure });
        },
      },
    }
  );

  // Refresh session token
  await supabase.auth.getUser();

  return response;
}
