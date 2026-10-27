-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "gender" "Gender";
