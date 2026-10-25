import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    // Use a generic error to avoid revealing whether an email exists.
    if (!admin || !admin.active) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await compare(dto.password, admin.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: admin.id,
      email: admin.email,
      tokenVersion: admin.tokenVersion,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '15h',
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        username: admin.username,
        phone: admin.phone,
        avatarUrl: admin.avatarUrl,
        role: admin.role,
        permissions: admin.permissions,
      },
    };
  }

  async logout(adminId: string) {
    const result = await this.prisma.adminUser.updateMany({
      where: {
        id: adminId,
        active: true,
      },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new UnauthorizedException();
    }

    return {
      message: 'Logged out successfully.',
    };
  }
}
