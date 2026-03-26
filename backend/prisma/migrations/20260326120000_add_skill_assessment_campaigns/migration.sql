-- CreateTable
CREATE TABLE "SkillAssessmentCampaign" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "minSkillsRequired" INTEGER NOT NULL DEFAULT 2,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillAssessmentCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignSkillSubmission" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "firstSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignSkillSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillAssessmentCampaign_startAt_idx" ON "SkillAssessmentCampaign"("startAt");

-- CreateIndex
CREATE INDEX "SkillAssessmentCampaign_endAt_idx" ON "SkillAssessmentCampaign"("endAt");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignSkillSubmission_campaignId_employeeId_skillId_key" ON "CampaignSkillSubmission"("campaignId", "employeeId", "skillId");

-- CreateIndex
CREATE INDEX "CampaignSkillSubmission_campaignId_idx" ON "CampaignSkillSubmission"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignSkillSubmission_employeeId_idx" ON "CampaignSkillSubmission"("employeeId");

-- CreateIndex
CREATE INDEX "CampaignSkillSubmission_skillId_idx" ON "CampaignSkillSubmission"("skillId");

-- AddForeignKey
ALTER TABLE "SkillAssessmentCampaign" ADD CONSTRAINT "SkillAssessmentCampaign_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSkillSubmission" ADD CONSTRAINT "CampaignSkillSubmission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SkillAssessmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSkillSubmission" ADD CONSTRAINT "CampaignSkillSubmission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSkillSubmission" ADD CONSTRAINT "CampaignSkillSubmission_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
