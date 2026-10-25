/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `AdminUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'ADMIN');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- Promote the existing owner account without changing its password.
UPDATE "AdminUser"
SET "role" = 'OWNER'
WHERE "email" = 'mehdileilaei443@gmail.com';