BEGIN;

ALTER TABLE "Project"
ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "ProjectTranslation"
ADD COLUMN "metaDescription" TEXT,
ADD COLUMN "metaTitle" TEXT,
ADD COLUMN "role" TEXT,
ADD COLUMN "summary" TEXT;

COMMIT;
