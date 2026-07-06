import { auth, ensureAuthDatabase } from '@/lib/auth';
import { Env } from '@/libs/Env';
import { toNextJsHandler } from 'better-auth/next-js';

const handlers = toNextJsHandler(auth);

function isAdminEmail(email: string) {
  const adminEmails = (Env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}

async function isAdminSignUpRequest(request: Request) {
  const pathname = new URL(request.url).pathname;
  return pathname.endsWith('/sign-up/email');
}

async function getSignUpEmail(request: Request) {
  try {
    const payload = await request.clone().json() as { email?: unknown };
    return typeof payload.email === 'string' ? payload.email : '';
  } catch {
    return '';
  }
}

export async function GET(request: Request) {
  await ensureAuthDatabase();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  await ensureAuthDatabase();

  if (await isAdminSignUpRequest(request)) {
    const email = await getSignUpEmail(request);
    if (!email || !isAdminEmail(email)) {
      return Response.json(
        { code: 'ADMIN_EMAIL_NOT_ALLOWED', message: 'This email is not allowed for admin access.' },
        { status: 403 },
      );
    }
  }

  return handlers.POST(request);
}
