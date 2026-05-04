import type { NextRequest } from 'next/server';
import { proxyPublicBackendRequest } from '@/lib/auth-server';

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function handleRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyPublicBackendRequest(request, path);
}

export const dynamic = 'force-dynamic';

export const GET = handleRequest;
