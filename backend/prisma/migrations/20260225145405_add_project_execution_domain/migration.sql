-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProjectAssignment" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "EmployeeProjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deliverable_projectId_name_key" ON "Deliverable"("projectId", "name");

-- CreateIndex
CREATE INDEX "EmployeeProjectAssignment_employeeId_idx" ON "EmployeeProjectAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeProjectAssignment_projectId_idx" ON "EmployeeProjectAssignment"("projectId");

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProjectAssignment" ADD CONSTRAINT "EmployeeProjectAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProjectAssignment" ADD CONSTRAINT "EmployeeProjectAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
