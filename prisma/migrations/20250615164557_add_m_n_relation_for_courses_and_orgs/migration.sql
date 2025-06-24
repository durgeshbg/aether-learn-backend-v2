/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Course` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,assessmentId]` on the table `CodeSolution` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_organizationId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "organizationId";

-- CreateTable
CREATE TABLE "CoursesOnOrganizations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoursesOnOrganizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoursesOnOrganizations_organizationId_courseId_key" ON "CoursesOnOrganizations"("organizationId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeSolution_userId_assessmentId_key" ON "CodeSolution"("userId", "assessmentId");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "User"("email");

-- AddForeignKey
ALTER TABLE "CoursesOnOrganizations" ADD CONSTRAINT "CoursesOnOrganizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursesOnOrganizations" ADD CONSTRAINT "CoursesOnOrganizations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
