import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Routes that require auth
  const protectedPaths = ['/dashboard', '/calendar', '/payments', '/meetings/create', '/ai', '/admin', '/onboarding'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // Not logged in → redirect to auth
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Logged in → check onboarding for protected pages (except /onboarding itself)
  if (user && isProtected && !pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith('/auth/') && user && !pathname.includes('callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}
