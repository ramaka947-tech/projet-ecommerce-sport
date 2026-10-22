/*
  Warnings:

  - You are about to drop the column `customerId` on the `Review` table. All the data in the column will be lost.
  - Added the required column `customerPhone` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Review" DROP COLUMN "customerId",
ADD COLUMN     "customerPhone" TEXT NOT NULL;
