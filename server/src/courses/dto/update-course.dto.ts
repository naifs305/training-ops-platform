import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  locationType?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  numTrainees?: number;

  @IsOptional()
  @IsString()
  courseType?: string;

  @IsOptional()
  @IsBoolean()
  requiresAdvance?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresRevenue?: boolean;

  @IsOptional()
  @IsBoolean()
  materialsIssued?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresAdvanceSettlement?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresSupervisorCompensation?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresTrainerCompensation?: boolean;

  @IsOptional()
  @IsString()
  operationalProjectId?: string;

  @IsOptional()
  @IsString()
  primaryEmployeeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingEmployeeIds?: string[];
}