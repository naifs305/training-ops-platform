import {
  IsString,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsDateString,
  IsArray,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class ReportSectionDto {
  @IsEnum(['excellent', 'good', 'needs_improvement', 'weak', 'requires_development'])
  rating: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

class AttachmentDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  size: number;

  @IsString()
  content: string;
}

class GeneratedCourseInfoDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : String(value),
  )
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : String(value),
  )
  @IsString()
  code?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : String(value),
  )
  @IsString()
  project?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : String(value),
  )
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : String(value),
  )
  @IsString()
  locationType?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : String(value),
  )
  @IsString()
  startDate?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : String(value),
  )
  @IsString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : String(value),
  )
  @IsString()
  traineesCount?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : String(value),
  )
  @IsString()
  supervisor?: string;
}

export class SubmitReportDto {
  @ValidateNested()
  @Type(() => ReportSectionDto)
  training_environment: ReportSectionDto;

  @ValidateNested()
  @Type(() => ReportSectionDto)
  trainer_evaluation: ReportSectionDto;

  @ValidateNested()
  @Type(() => ReportSectionDto)
  lms_content_evaluation: ReportSectionDto;

  @ValidateNested()
  @Type(() => ReportSectionDto)
  trainee_evaluation: ReportSectionDto;

  @ValidateNested()
  @Type(() => ReportSectionDto)
  program_evaluation: ReportSectionDto;

  @IsOptional()
  @IsString()
  other_notes?: string;

  @IsBoolean()
  declarationConfirmed: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsArray()
  attachments?: AttachmentDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GeneratedCourseInfoDto)
  generatedCourseInfo?: GeneratedCourseInfoDto;
}

export class SubmitAdvanceDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsDateString()
  requestDate: string;

  @IsDateString()
  receiptDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SubmitSettlementDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  advanceAmount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  spentAmount: number;

  @IsDateString()
  deliveredToAuditorDate: string;

  @IsDateString()
  invoicesUploadedDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RevenueStatusDto {
  @IsEnum(['مكتمل', 'غير مكتمل', 'قيد التسوية'])
  status: string;
}