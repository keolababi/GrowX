CREATE TYPE "ProfessionalApplicationType" AS ENUM ('BUSINESS', 'MENTOR');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "ProfessionalApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ProfessionalApplicationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "organizationName" VARCHAR(160),
    "registrationNumber" VARCHAR(80),
    "websiteUrl" TEXT,
    "expertise" VARCHAR(160),
    "experience" TEXT,
    "evidenceUrl" TEXT,
    "reviewNote" VARCHAR(500),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfessionalApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfessionalApplication_userId_type_key" ON "ProfessionalApplication"("userId", "type");
CREATE INDEX "ProfessionalApplication_status_createdAt_idx" ON "ProfessionalApplication"("status", "createdAt");
CREATE INDEX "ProfessionalApplication_userId_createdAt_idx" ON "ProfessionalApplication"("userId", "createdAt");

ALTER TABLE "ProfessionalApplication"
ADD CONSTRAINT "ProfessionalApplication_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
