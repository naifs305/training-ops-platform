-- CreateEnum
CREATE TYPE "KpiPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PerformanceLevel" AS ENUM ('OUTSTANDING', 'VERY_GOOD', 'GOOD', 'NEEDS_IMPROVEMENT', 'WEAK');

-- CreateTable
CREATE TABLE "EmployeeKpiSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default KPI Settings',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "closureCompletionWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "overdueClosuresWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "avgElementSubmissionWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "avgResubmissionWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "avgCourseClosureWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "firstPassApprovalWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "returnRateWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "rejectRateWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "errorRateWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "overdueCoursesWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "overdueElementsWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "staleElementsWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeKpiSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeKpiSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodType" "KpiPeriodType" NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "requiredElementsCount" INTEGER NOT NULL DEFAULT 0,
    "completedElementsCount" INTEGER NOT NULL DEFAULT 0,
    "closureCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueCoursesCount" INTEGER NOT NULL DEFAULT 0,
    "closedCoursesCount" INTEGER NOT NULL DEFAULT 0,
    "dueCourseClosureRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "submittedElementsCount" INTEGER NOT NULL DEFAULT 0,
    "approvedElementsCount" INTEGER NOT NULL DEFAULT 0,
    "returnedElementsCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedElementsCount" INTEGER NOT NULL DEFAULT 0,
    "firstPassApprovalRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rejectRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operationalErrorRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgElementSubmissionHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgResubmissionHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCourseClosureDelayDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overdueCoursesCount" INTEGER NOT NULL DEFAULT 0,
    "overdueCoursesRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overdueElementsCount" INTEGER NOT NULL DEFAULT 0,
    "overdueElementsRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stalePendingElementsCount" INTEGER NOT NULL DEFAULT 0,
    "stalePendingElementsRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productivityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disciplineScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performanceLevel" "PerformanceLevel" NOT NULL DEFAULT 'GOOD',
    "settingsId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeKpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeKpiNote" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeKpiNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeKpiSnapshot_periodType_periodStart_periodEnd_idx" ON "EmployeeKpiSnapshot"("periodType", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "EmployeeKpiSnapshot_finalScore_idx" ON "EmployeeKpiSnapshot"("finalScore");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeKpiSnapshot_userId_periodType_periodLabel_key" ON "EmployeeKpiSnapshot"("userId", "periodType", "periodLabel");

-- CreateIndex
CREATE INDEX "EmployeeKpiNote_snapshotId_idx" ON "EmployeeKpiNote"("snapshotId");

-- CreateIndex
CREATE INDEX "EmployeeKpiNote_userId_idx" ON "EmployeeKpiNote"("userId");

-- CreateIndex
CREATE INDEX "EmployeeKpiNote_managerId_idx" ON "EmployeeKpiNote"("managerId");

-- AddForeignKey
ALTER TABLE "EmployeeKpiSnapshot" ADD CONSTRAINT "EmployeeKpiSnapshot_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "EmployeeKpiSetting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeKpiSnapshot" ADD CONSTRAINT "EmployeeKpiSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeKpiNote" ADD CONSTRAINT "EmployeeKpiNote_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "EmployeeKpiSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeKpiNote" ADD CONSTRAINT "EmployeeKpiNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeKpiNote" ADD CONSTRAINT "EmployeeKpiNote_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
