import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive',
        },
      },
      include: { operationalProject: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobileNumber: true,
        extensionNumber: true,
        roles: true,
        isActive: true,
        operationalProjectId: true,
        operationalProject: true,
        createdAt: true,
        updatedAt: true,
        termsAccepted: true,
        termsAcceptedAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobileNumber: true,
        extensionNumber: true,
        roles: true,
        isActive: true,
        operationalProjectId: true,
        operationalProject: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { isActive: 'desc' },
        { firstName: 'asc' },
      ],
    });
  }

  async updateUser(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobileNumber: true,
        extensionNumber: true,
        roles: true,
        isActive: true,
        operationalProjectId: true,
        operationalProject: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}