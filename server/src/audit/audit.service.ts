import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, roleContext: string, action: string, details: any = {}, courseId?: string) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        roleContext,
        action,
        details,
        courseId: courseId || null
      }
    });
  }
}