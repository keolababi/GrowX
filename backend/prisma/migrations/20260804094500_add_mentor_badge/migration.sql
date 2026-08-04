-- Existing and new profiles remain regular users until they explicitly opt in as mentors.
ALTER TABLE "Profile"
ADD COLUMN "isMentor" BOOLEAN NOT NULL DEFAULT false;
