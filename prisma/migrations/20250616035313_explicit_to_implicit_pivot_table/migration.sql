/*
  Warnings:

  - You are about to drop the `CoursesOnOrganizations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CoursesOnOrganizations" DROP CONSTRAINT "CoursesOnOrganizations_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CoursesOnOrganizations" DROP CONSTRAINT "CoursesOnOrganizations_organizationId_fkey";

-- DropTable
DROP TABLE "CoursesOnOrganizations";

-- CreateTable
CREATE TABLE "_CourseToOrganization" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseToOrganization_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CourseToOrganization_B_index" ON "_CourseToOrganization"("B");

-- AddForeignKey
ALTER TABLE "_CourseToOrganization" ADD CONSTRAINT "_CourseToOrganization_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToOrganization" ADD CONSTRAINT "_CourseToOrganization_B_fkey" FOREIGN KEY ("B") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
