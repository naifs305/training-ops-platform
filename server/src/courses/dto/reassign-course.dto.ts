import { IsString } from 'class-validator';

export class ReassignCourseDto {
  @IsString()
  primaryEmployeeId: string;
}