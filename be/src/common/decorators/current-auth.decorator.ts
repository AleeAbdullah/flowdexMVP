import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthContext {
  sub: string;
  email: string;
  role: string;
  sessionId: string;
}

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const request = context.switchToHttp().getRequest();
    return request.auth as AuthContext;
  },
);
