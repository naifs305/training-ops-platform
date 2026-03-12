export class UpdateCourseDto {
  name?: string;
  code?: string;
  city?: string;
  locationType?: string;
  startDate?: string;
  endDate?: string;
  numTrainees?: number;
  courseType?: string;
  requiresAdvance?: boolean;
  requiresRevenue?: boolean;
  materialsIssued?: boolean;
  requiresAdvanceSettlement?: boolean;
  requiresSupervisorCompensation?: boolean;
  requiresTrainerCompensation?: boolean;
  operationalProjectId?: string;
  primaryEmployeeId?: string;
  supportingEmployeeIds?: string[];
}