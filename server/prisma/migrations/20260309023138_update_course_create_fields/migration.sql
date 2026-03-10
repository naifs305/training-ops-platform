-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "requiresAdvanceSettlement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresSupervisorCompensation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresTrainerCompensation" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "beneficiaryEntity" DROP NOT NULL;
