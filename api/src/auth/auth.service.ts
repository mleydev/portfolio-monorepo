import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { ConflictException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { NotFoundException } from '@nestjs/common';
import { UpdateMyAvatarDto } from './dto/update-my-avatar.dto';

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

  async getMyProfile(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        phone: true,
        avatarUrl: true,
        role: true,
        permissions: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin || !admin.active) {
      throw new UnauthorizedException();
    }

    return admin;
  }

  async updateMyProfile(adminId: string, dto: UpdateMyProfileDto) {
    const current = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, active: true },
    });

    if (!current || !current.active) {
      throw new UnauthorizedException();
    }

    const data: {
      fullName?: string;
      username?: string | null;
      phone?: string | null;
    } = {};

    if (dto.fullName !== undefined) {
      data.fullName = dto.fullName.trim();
    }

    if (dto.username !== undefined) {
      data.username = dto.username?.trim() || null;
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone?.trim() || null;
    }

    try {
      await this.prisma.adminUser.update({
        where: { id: adminId },
        data,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username is already in use.');
      }

      throw error;
    }
    return this.getMyProfile(adminId);
  }

  async changePassword(adminId: string, dto: ChangePasswordDto) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.active) {
      throw new UnauthorizedException();
    }

    const matches = await compare(dto.currentPassword, admin.passwordHash);

    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException(
        'New password must be different from the current password.',
      );
    }

    const passwordHash = await hash(dto.newPassword, 12);

    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    return {
      message: 'Password changed successfully. Please log in again.',
    };
  }

  async updateMyAvatar(adminId: string, dto: UpdateMyAvatarDto) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, active: true },
    });

    if (!admin || !admin.active) {
      throw new UnauthorizedException();
    }

    const media = await this.prisma.media.findUnique({
      where: { id: dto.mediaId },
      select: {
        id: true,
        type: true,
        url: true,
      },
    });

    if (!media || media.type !== 'IMAGE') {
      throw new NotFoundException('Image media was not found.');
    }

    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { avatarUrl: media.url },
    });

    return this.getMyProfile(adminId);
  }
}
