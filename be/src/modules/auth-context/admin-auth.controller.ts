import { Body, Controller, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AdminAuthService } from './admin-auth.service';
import {
  AdminLoginDto,
  AdminLoginResponseDto,
  AdminUserResponseDto,
  ChangeAdminPasswordDto,
  CreateAdminUserDto,
} from './dto/admin-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  login(@Body() body: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminAuthService.login(body.email, body.password);
  }

  @Post('admin-users')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  createAdminUser(@Body() body: CreateAdminUserDto): Promise<AdminUserResponseDto> {
    return this.adminAuthService.createAdminUser({
      email: body.email,
      password: body.password,
      name: body.name,
    });
  }

  @Patch('admin-users/password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  changeAdminPassword(@Body() body: ChangeAdminPasswordDto): Promise<AdminUserResponseDto> {
    return this.adminAuthService.changeAdminPassword({
      email: body.email,
      newPassword: body.newPassword,
    });
  }
}
