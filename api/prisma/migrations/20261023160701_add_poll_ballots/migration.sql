/*
  Warnings:

  - You are about to drop the column `pollId` on the `PollVote` table. All the data in the column will be lost.
  - You are about to drop the column `voterKey` on the `PollVote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ballotId,optionId]` on the table `PollVote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ballotId` to the `PollVote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PollVote" DROP CONSTRAINT "PollVote_pollId_fkey";

-- DropIndex
DROP INDEX "PollVote_pollId_optionId_idx";

-- DropIndex
DROP INDEX "PollVote_pollId_voterKey_optionId_key";

-- AlterTable
ALTER TABLE "PollVote" DROP COLUMN "pollId",
DROP COLUMN "voterKey",
ADD COLUMN     "ballotId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PollBallot" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollBallot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PollBallot_createdAt_idx" ON "PollBallot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PollBallot_pollId_voterKey_key" ON "PollBallot"("pollId", "voterKey");

-- CreateIndex
CREATE INDEX "PollVote_optionId_idx" ON "PollVote"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_ballotId_optionId_key" ON "PollVote"("ballotId", "optionId");

-- AddForeignKey
ALTER TABLE "PollBallot" ADD CONSTRAINT "PollBallot_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_ballotId_fkey" FOREIGN KEY ("ballotId") REFERENCES "PollBallot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
