import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { KpiPeriodType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { KpisService } from './kpis.service';

@Controller('kpis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Post('calculate')
  async calculate(
    @Body()
    body: {
      periodType: KpiPeriodType;
      year: number;
      value?: number;
    },
    @Req() req: any,
  ) {
    return this.kpisService.calculateAndStore(
      body.periodType,
      Number(body.year),
      body.value ? Number(body.value) : undefined,
      req.user.userId,
    );
  }

  @Get('assignments')
  async getAssignmentRegister(
    @Query('periodType') periodType: KpiPeriodType,
    @Query('year') year: string,
    @Query('value') value?: string,
  ) {
    return this.kpisService.getAssignmentRegister(
      periodType,
      Number(year),
      value ? Number(value) : undefined,
    );
  }

  @Post('assignments')
  async upsertAssignmentRegister(
    @Body()
    body: {
      userId: string;
      periodType: KpiPeriodType;
      year: number;
      value?: number;
      assignedCoursesCount: number;
      notes?: string;
    },
    @Req() req: any,
  ) {
    return this.kpisService.upsertAssignmentRegister(
      req.user.userId,
      body.userId,
      body.periodType,
      Number(body.year),
      body.value ? Number(body.value) : undefined,
      Number(body.assignedCoursesCount),
      body.notes,
    );
  }

  @Get()
  async getSnapshots(
    @Query('periodType') periodType?: KpiPeriodType,
    @Query('periodLabel') periodLabel?: string,
  ) {
    return this.kpisService.getSnapshots(periodType, periodLabel);
  }

  @Get(':userId/:periodType/:periodLabel')
  async getEmployeeSnapshotDetails(
    @Param('userId') userId: string,
    @Param('periodType') periodType: KpiPeriodType,
    @Param('periodLabel') periodLabel: string,
  ) {
    return this.kpisService.getEmployeeSnapshotDetails(
      userId,
      periodType,
      periodLabel,
    );
  }

  @Post(':snapshotId/notes')
  async addManagerNote(
    @Param('snapshotId') snapshotId: string,
    @Body()
    body: {
      userId: string;
      note: string;
    },
    @Req() req: any,
  ) {
    return this.kpisService.addManagerNote(
      snapshotId,
      body.userId,
      req.user.userId,
      body.note,
    );
  }
}