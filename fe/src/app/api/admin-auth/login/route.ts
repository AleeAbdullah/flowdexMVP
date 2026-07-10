import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AdminLoginError, attachAdminSessionCookie, clearAdminSessionCookie, loginAdminWithBackend } from '@/lib/admin-auth.server';

const schema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(1),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof schema>;

  try {
    parsed = schema.parse(await request.json());
  } catch {
    const response = NextResponse.json(
      { code: 'INVALID_INPUT', message: 'Enter a valid email and password.' },
      { status: 400 },
    );
    clearAdminSessionCookie(response);
    return response;
  }

  try {
    const result = await loginAdminWithBackend({
      email: parsed.email,
      password: parsed.password,
    });

    const response = NextResponse.json({ user: result.user });
    attachAdminSessionCookie(response, result);
    return response;
  } catch (error) {
    const status = error instanceof AdminLoginError ? error.status : 500;
    const code = error instanceof AdminLoginError ? error.code : 'UNKNOWN';
    const message = error instanceof AdminLoginError
      ? error.message
      : 'We could not sign you in.';

    const response = NextResponse.json({ code, message }, { status });
    clearAdminSessionCookie(response);
    return response;
  }
}
