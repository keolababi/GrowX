CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "difficulty" VARCHAR(30) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lesson_published_sortOrder_idx" ON "Lesson"("published", "sortOrder");
CREATE INDEX "Lesson_category_published_idx" ON "Lesson"("category", "published");
