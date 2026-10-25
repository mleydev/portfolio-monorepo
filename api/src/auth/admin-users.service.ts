import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
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
  }

  async create(dto: CreateAdminUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.adminUser.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    if (dto.username) {
      const username = dto.username.trim();

      const existingUsername = await this.prisma.adminUser.findUnique({
        where: { username },
        select: { id: true },
      });

      if (existingUsername) {
        throw new ConflictException('This username is already in use.');
      }
    }

    const passwordHash = await hash(dto.password, 12);

    const admin = await this.prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName.trim(),
        username: dto.username?.trim() || null,
        phone: dto.phone?.trim() || null,
        role: 'ADMIN',
        permissions: dto.permissions ?? [],
        active: true,
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
        active: true,
        createdAt: true,
      },
    });

    return admin;
  }

  async updatePermissions(id: string, permissions: string[]) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      throw new NotFoundException('Admin account not found.');
    }

    if (existing.role === 'OWNER') {
      throw new ConflictException('Owner permissions cannot be modified here.');
    }

    return this.prisma.adminUser.update({
      where: { id },
      data: {
        permissions,
        tokenVersion: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        active: true,
      },
    });
  }

  async setActive(id: string, active: boolean) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      throw new NotFoundException('Admin account not found.');
    }

    if (existing.role === 'OWNER') {
      throw new ConflictException('Owner status cannot be changed here.');
    }

    return this.prisma.adminUser.update({
      where: { id },
      data: {
        active,
        tokenVersion: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        active: true,
      },
    });
  }
}
