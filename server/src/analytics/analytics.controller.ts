import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('manager')
  @Roles('MANAGER')
  async getManagerData(@Query('projectId') projectId: string) {
    return this.analytics.getManagerDashboard(projectId);
  }

  @Get('employee')
  async getEmployeeData(@Req() req) {
    return this.analytics.getEmployeeDashboard(req.user.userId);
  }

  @Get('kpi')
  async getKPI(@Req() req) {
    return this.analytics.getEmployeeKPI(req.user.userId);
  }
  
  @Get('approvals-queue')
  @Roles('MANAGER')
  async getApprovalsQueue() {
    return this.analytics.getPendingApprovalsQueue();
  }
}