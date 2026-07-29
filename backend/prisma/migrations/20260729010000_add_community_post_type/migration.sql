ALTER TABLE "Post" ADD COLUMN "communityPostType" TEXT;

UPDATE "Post"
SET "communityPostType" = CASE
  WHEN "imageUrl" IS NOT NULL THEN 'ARTICLE'
  ELSE 'DISCUSSION'
END
WHERE "communityId" IS NOT NULL;
