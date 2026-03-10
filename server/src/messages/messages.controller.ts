import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  private getUserRole(req: any): string {
    const headerRole = req.headers['x-active-role'];
    const roles = req.user?.roles || [];

    if (headerRole && roles.includes(headerRole)) return headerRole;
    if (roles.includes('MANAGER')) return 'MANAGER';
    if (roles.includes('EMPLOYEE')) return 'EMPLOYEE';
    return roles[0] || 'EMPLOYEE';
  }

  @Get('users')
  async getUsers(@Req() req: any) {
    return this.messagesService.getUsersForMessaging(
      req.user.userId,
      this.getUserRole(req),
    );
  }

  @Get('inbox')
  async getInbox(@Req() req: any) {
    return this.messagesService.getInbox(req.user.userId);
  }

  @Get('sent')
  async getSent(@Req() req: any) {
    return this.messagesService.getSent(req.user.userId);
  }

  @Post()
  async sendMessage(
    @Req() req: any,
    @Body()
    body: {
      recipientIds: string[];
      subject: string;
      message: string;
      courseId?: string;
    },
  ) {
    return this.messagesService.sendMessage(
      req.user.userId,
      this.getUserRole(req),
      body,
    );
  }

  @Put(':messageId/read')
  async markAsRead(@Param('messageId') messageId: string, @Req() req: any) {
    return this.messagesService.markAsRead(messageId, req.user.userId);
  }
}