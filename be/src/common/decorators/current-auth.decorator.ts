import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthContext {
  sub: string;
  authType: 'admin' | 'wallet';
  email?: string;
  role?: string;
  sessionId: string;
  walletAddressNormalized?: string;
  walletAddressChecksum?: string;
  lastVerifiedChainId?: number | null;
}

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const request = context.switchToHttp().getRequest();
    return request.auth as AuthContext;
  },
);
