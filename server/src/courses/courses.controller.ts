import { Controller, Post, Body, Get, Param, Req, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ReassignCourseDto } from './dto/reassign-course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  private getUserRole(req: any): string {
    const headerRole = req.headers['x-active-role'];
    const roles = req.user?.roles || [];

    if (headerRole && roles.includes(headerRole)) return headerRole;
    if (roles.includes('MANAGER')) return 'MANAGER';
    if (roles.includes('EMPLOYEE')) return 'EMPLOYEE';
    return roles[0] || 'EMPLOYEE';
  }

  @Post()
  @Roles('EMPLOYEE')
  async create(@Body() dto: CreateCourseDto, @Req() req: any) {
    return this.coursesService.create(dto, req.user.userId, this.getUserRole(req));
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: { projectId?: string; status?: string }) {
    return this.coursesService.findAll(
      req.user.userId,
      this.getUserRole(req),
      query.projectId,
      query.status
    );
  }

  @Get('archived')
  async getArchived(@Req() req: any, @Query('search') search?: string) {
    return this.coursesService.findArchived(
      search,
      req.user.userId,
      this.getUserRole(req),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.findOne(id, req.user.userId, this.getUserRole(req));
  }

  @Put(':id/archive')
  @Roles('MANAGER')
  async archive(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.archiveCourse(id, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.deleteCourse(id, req.user.userId, this.getUserRole(req));
  }

  @Put(':id/reassign')
  @Roles('MANAGER')
  async reassign(
    @Param('id') id: string,
    @Body() dto: ReassignCourseDto,
    @Req() req: any,
  ) {
    return this.coursesService.reassignCourse(id, dto.primaryEmployeeId, req.user.userId);
  }
}