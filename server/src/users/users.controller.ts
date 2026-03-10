import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Get()
  @Roles('MANAGER')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('MANAGER')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles('MANAGER')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateUser(id, body);
  }

  @Put(':id/reset-password')
  @Roles('MANAGER')
  async resetPassword(@Param('id') id: string, @Body('password') password: string) {
    const hash = await bcrypt.hash(password, 10);
    return this.usersService.updateUser(id, { passwordHash: hash });
  }
}