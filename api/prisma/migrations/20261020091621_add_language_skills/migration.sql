-- CreateEnum
CREATE TYPE "CEFRLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE');

-- CreateTable
CREATE TABLE "LanguageSkill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "CEFRLevel" NOT NULL,
    "proficiency" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LanguageSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageSkillTranslation" (
    "id" TEXT NOT NULL,
    "languageSkillId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "LanguageSkillTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LanguageSkill_enabled_sortOrder_idx" ON "LanguageSkill"("enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "LanguageSkillTranslation_languageSkillId_language_key" ON "LanguageSkillTranslation"("languageSkillId", "language");

-- AddForeignKey
ALTER TABLE "LanguageSkillTranslation" ADD CONSTRAINT "LanguageSkillTranslation_languageSkillId_fkey" FOREIGN KEY ("languageSkillId") REFERENCES "LanguageSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
