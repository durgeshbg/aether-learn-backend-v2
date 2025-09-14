-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "modulesCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EnrolledCourseProgress" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false;
