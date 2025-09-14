/*
  Warnings:

  - You are about to drop the column `completed` on the `EnrolledCourseProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EnrolledCourseProgress" DROP COLUMN "completed",
ADD COLUMN     "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
