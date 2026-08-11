CREATE TYPE "MessageMediaType" AS ENUM ('IMAGE', 'VIDEO');

ALTER TABLE "Message"
ADD COLUMN "mediaType" "MessageMediaType",
ADD COLUMN "mediaUrl" TEXT;
