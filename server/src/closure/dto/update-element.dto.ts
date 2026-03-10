import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum UpdateElementStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  RETURNED = 'RETURNED',
}

export class UpdateElementDto {
  @IsEnum(UpdateElementStatus)
  status: UpdateElementStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}