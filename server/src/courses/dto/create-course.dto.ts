import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  @IsIn(['INTERNAL', 'EXTERNAL', 'REMOTE'])
  locationType: string;

  @IsString()
  city: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  traineesCount: number;

  @IsOptional()
  @IsBoolean()
  requiresAdvance?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresAdvanceSettlement?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresMaterialReturn?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresCoordinatorCompensation?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresTrainerCompensation?: boolean;
}