import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AuthContext } from '../decorators/current-auth.decorator';

@Injectable()
export class InternalJwtGuard implements CanActivate {
  private readonly logger = new Logger(InternalJwtGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      this.logger.warn('Rejected request with missing bearer token.');
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length);

    try {
      const payload = await this.jwtService.verifyAsync<AuthContext>(token, {
        secret: this.configService.getOrThrow<string>('INTERNAL_AUTH_JWT_SECRET'),
        issuer: this.configService.get<string>('INTERNAL_AUTH_ISSUER', 'fe-bff'),
        audience: this.configService.get<string>('INTERNAL_AUTH_AUDIENCE', 'be-api'),
      });

      request.auth = payload;
      return true;
    } catch (error) {
      this.logger.warn(
        `Rejected request with invalid internal auth token: ${
          error instanceof Error ? error.message : 'Unknown verification error'
        }.`,
      );
      throw new UnauthorizedException('Invalid internal auth token');
    }
  }
}
