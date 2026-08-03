-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PERSONAL', 'BUSINESS');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'PERSONAL',
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "industry" VARCHAR(120),
ADD COLUMN     "location" VARCHAR(120),
ADD COLUMN     "services" TEXT;
