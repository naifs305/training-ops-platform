import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  roles?: string[];
  
  @IsOptional()
  @IsString()
  operationalProjectId?: string;
}