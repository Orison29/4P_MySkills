-- CreateEnum
CREATE TYPE "SkillChangeType" AS ENUM ('INITIAL_RATING', 'SELF_UPDATED', 'MANAGER_APPROVED', 'MANAGER_EDITED', 'MANAGER_REJECTED');

-- CreateTable
CREATE TABLE "SkillProgressLog" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "previousRating" INTEGER,
    "newRating" INTEGER NOT NULL,
    "changeType" "SkillChangeType" NOT NULL,
    "changedBy" UUID,
    "comment" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillProgressLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillProgressLog_employeeId_idx" ON "SkillProgressLog"("employeeId");

-- CreateIndex
CREATE INDEX "SkillProgressLog_skillId_idx" ON "SkillProgressLog"("skillId");

-- CreateIndex
CREATE INDEX "SkillProgressLog_changedAt_idx" ON "SkillProgressLog"("changedAt");

-- AddForeignKey
ALTER TABLE "SkillProgressLog" ADD CONSTRAINT "SkillProgressLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProgressLog" ADD CONSTRAINT "SkillProgressLog_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProgressLog" ADD CONSTRAINT "SkillProgressLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
