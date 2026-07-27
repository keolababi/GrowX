CREATE TABLE "CommunityMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunityMember_userId_communityId_key"
ON "CommunityMember"("userId", "communityId");

CREATE INDEX "CommunityMember_communityId_createdAt_idx"
ON "CommunityMember"("communityId", "createdAt");

ALTER TABLE "CommunityMember"
ADD CONSTRAINT "CommunityMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityMember"
ADD CONSTRAINT "CommunityMember_communityId_fkey"
FOREIGN KEY ("communityId") REFERENCES "Community"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
