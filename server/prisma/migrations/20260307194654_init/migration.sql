-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('PREPARATION', 'EXECUTION', 'AWAITING_CLOSURE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ElementStatus" AS ENUM ('NOT_APPLICABLE', 'NOT_STARTED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "OperationalProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "extensionNumber" TEXT,
    "roles" "Role"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "operationalProjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "beneficiaryEntity" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "numTrainees" INTEGER NOT NULL,
    "courseType" TEXT NOT NULL,
    "requiresAdvance" BOOLEAN NOT NULL DEFAULT false,
    "requiresRevenue" BOOLEAN NOT NULL DEFAULT false,
    "materialsIssued" BOOLEAN NOT NULL DEFAULT false,
    "status" "CourseStatus" NOT NULL DEFAULT 'PREPARATION',
    "operationalProjectId" TEXT NOT NULL,
    "primaryEmployeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSupport" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CourseSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosureElement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isFormBased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClosureElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseClosureTracking" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "status" "ElementStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "executionAt" TIMESTAMP(3),
    "executedById" TEXT,
    "decisionAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "formData" JSONB,

    CONSTRAINT "CourseClosureTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "userId" TEXT NOT NULL,
    "roleContext" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationalProject_name_key" ON "OperationalProject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSupport_courseId_userId_key" ON "CourseSupport"("courseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClosureElement_key_key" ON "ClosureElement"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CourseClosureTracking_courseId_elementId_key" ON "CourseClosureTracking"("courseId", "elementId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_operationalProjectId_fkey" FOREIGN KEY ("operationalProjectId") REFERENCES "OperationalProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_operationalProjectId_fkey" FOREIGN KEY ("operationalProjectId") REFERENCES "OperationalProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_primaryEmployeeId_fkey" FOREIGN KEY ("primaryEmployeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSupport" ADD CONSTRAINT "CourseSupport_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSupport" ADD CONSTRAINT "CourseSupport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseClosureTracking" ADD CONSTRAINT "CourseClosureTracking_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseClosureTracking" ADD CONSTRAINT "CourseClosureTracking_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseClosureTracking" ADD CONSTRAINT "CourseClosureTracking_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseClosureTracking" ADD CONSTRAINT "CourseClosureTracking_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "ClosureElement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
