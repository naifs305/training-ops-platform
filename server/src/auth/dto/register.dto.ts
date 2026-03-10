import { IsEmail, IsString, IsBoolean, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  mobileNumber: string;

  @IsOptional()
  @IsString()
  extensionNumber?: string;

  @IsString()
  password: string;

  @IsString()
  operationalProjectId: string;

  @IsBoolean()
  acceptTerms: boolean;
}