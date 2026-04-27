import type { NextRequest } from 'next/server';
import { proxyBackendRequest } from '@/lib/auth-server';

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function handleRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyBackendRequest(request, path);
}

export const dynamic = 'force-dynamic';

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
