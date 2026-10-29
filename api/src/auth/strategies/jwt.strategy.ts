import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { Request } from 'express';
import { AUTH_COOKIE_NAME } from '../auth-cookie.constants';
interface JwtPayload {
  sub: string;
  email: string;
  tokenVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.[AUTH_COOKIE_NAME] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (
      !payload.sub ||
      !Number.isInteger(payload.tokenVersion) ||
      payload.tokenVersion < 0
    ) {
      throw new UnauthorizedException();
    }

    const admin = await this.prisma.adminUser.findFirst({
      where: {
        id: payload.sub,
        active: true,
        tokenVersion: payload.tokenVersion,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        phone: true,
        avatarUrl: true,
        role: true,
        permissions: true,
        tokenVersion: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException();
    }

    return admin;
  }
}
