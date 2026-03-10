import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifService: NotificationsService) {}

  @Get()
  async getMine(@Req() req) {
    return this.notifService.getUserNotifications(req.user.userId);
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string, @Req() req) {
    return this.notifService.markAsRead(id, req.user.userId);
  }
}