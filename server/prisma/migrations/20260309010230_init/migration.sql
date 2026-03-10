/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `ElementStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ElementStatus_new" AS ENUM ('NOT_STARTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'NOT_APPLICABLE', 'RETURNED');
ALTER TABLE "CourseClosureTracking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CourseClosureTracking" ALTER COLUMN "status" TYPE "ElementStatus_new" USING ("status"::text::"ElementStatus_new");
ALTER TYPE "ElementStatus" RENAME TO "ElementStatus_old";
ALTER TYPE "ElementStatus_new" RENAME TO "ElementStatus";
DROP TYPE "ElementStatus_old";
ALTER TABLE "CourseClosureTracking" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
COMMIT;
