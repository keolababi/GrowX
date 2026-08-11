CREATE TABLE "PodcastListen" (
  "id" TEXT NOT NULL,
  "podcastId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PodcastListen_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PodcastListen_podcastId_userId_key"
ON "PodcastListen"("podcastId", "userId");

CREATE INDEX "PodcastListen_podcastId_createdAt_idx"
ON "PodcastListen"("podcastId", "createdAt");

CREATE INDEX "PodcastListen_userId_createdAt_idx"
ON "PodcastListen"("userId", "createdAt");

ALTER TABLE "PodcastListen"
ADD CONSTRAINT "PodcastListen_podcastId_fkey"
FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PodcastListen"
ADD CONSTRAINT "PodcastListen_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
