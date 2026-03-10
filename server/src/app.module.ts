import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { CoursesModule } from './courses/courses.module';
import { ClosureModule } from './closure/closure.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { MessagesModule } from './messages/messages.module';
import { KpisModule } from './kpis/kpis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    CoursesModule,
    ClosureModule,
    NotificationsModule,
    AnalyticsModule,
    AuditModule,
    MessagesModule,
    KpisModule,
  ],
})
export class AppModule {}