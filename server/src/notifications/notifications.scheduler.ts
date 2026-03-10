import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationScheduler {
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDelays() {
    console.log('Running delay check cron...');
    
    const now = new Date();
    
    const courses = await this.prisma.course.findMany({
      where: { 
        endDate: { lt: now },
        status: { notIn: ['CLOSED', 'ARCHIVED'] }
      },
      include: {
        closureElements: { 
          include: { element: true } 
        },
        primaryEmployee: true
      }
    });

    for (const course of courses) {
      const daysSinceEnd = Math.floor((now.getTime() - new Date(course.endDate).getTime()) / (1000 * 60 * 60 * 24));
      
      for (const el of course.closureElements) {
        if (el.status === 'NOT_APPLICABLE') continue;
        
        if (['NOT_STARTED', 'IN_PROGRESS'].includes(el.status)) {
          if (daysSinceEnd >= 3 && daysSinceEnd < 5) {
            await this.notifService.create(
              course.primaryEmployeeId,
              'DELAY_WARNING',
              'تأخر في المهمة',
              `عنصر "${el.element.name}" في الدورة "${course.name}" متأخر عن الإغلاق.`,
              { courseId: course.id, elementId: el.id }
            );
          }
          
          if (daysSinceEnd >= 5) {
            const managers = await this.prisma.user.findMany({
              where: { roles: { has: 'MANAGER' }, isActive: true }
            });
            
            for (const manager of managers) {
              await this.notifService.create(
                manager.id,
                'ESCALATION',
                'تصعيد تأخر مهمة',
                `الموظف ${course.primaryEmployee.firstName} تأخر في عنصر "${el.element.name}" للدورة "${course.name}".`,
                { courseId: course.id, elementId: el.id }
              );
            }
          }
        }
      }
    }
  }
}