import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getLogs(@Query('userId') userId?: string, @Query('action') action?: string) {
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }
}