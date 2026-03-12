import {
  IsString,
  IsDateString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  city: string;

  @IsString()
  locationType: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @Type(() => Number)
  @IsInt()
  numTrainees: number;

  @IsString()
  operationalProjectId: string;

  @IsString()
  primaryEmployeeId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingEmployeeIds?: string[];

  @IsString()
  courseType: string;

  @IsBoolean()
  requiresAdvance: boolean;

  @IsBoolean()
  requiresRevenue: boolean;

  @IsBoolean()
  materialsIssued: boolean;

  @IsBoolean()
  requiresAdvanceSettlement: boolean;

  @IsBoolean()
  requiresSupervisorCompensation: boolean;

  @IsBoolean()
  requiresTrainerCompensation: boolean;
}