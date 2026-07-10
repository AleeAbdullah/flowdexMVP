import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@flowdex.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'super-secret-password' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class AdminLoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ description: 'Access token lifetime in seconds' })
  expiresIn!: number;

  @ApiProperty()
  user!: {
    userId: string;
    email: string;
    role: string;
    status: string;
  };
}

export class CreateAdminUserDto {
  @ApiProperty({ example: 'admin@flowdex.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'super-secret-password' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'FlowDex Admin', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}

export class ChangeAdminPasswordDto {
  @ApiProperty({ example: 'admin@flowdex.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'new-super-secret-password' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class AdminUserResponseDto {
  @ApiProperty()
  user!: {
    userId: string;
    email: string;
    role: string;
    status: string;
  };
}
