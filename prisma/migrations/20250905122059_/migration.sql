-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- DropIndex
DROP INDEX "CodeSolution_userId_assessmentId_key";

-- AlterTable
ALTER TABLE "CodeAssessment" ADD COLUMN     "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enrolledCourseProgressId" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "codeAssessmentsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lessonsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quizzesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "objectives" TEXT[];

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enrolledCourseProgressId" TEXT,
ADD COLUMN     "objectives" TEXT[];

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "coursesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usersCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enrolledCourseProgressId" TEXT,
ADD COLUMN     "passPercentage" INTEGER NOT NULL DEFAULT 70;

-- AlterTable
ALTER TABLE "QuizResult" ADD COLUMN     "passed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responses" TEXT[];

-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "weight" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "streakCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "EnrolledCourseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "nextModuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrolledCourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookmarkModule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookmarkModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseFeedback" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnrolledCourseProgress_userId_courseId_key" ON "EnrolledCourseProgress"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "BookmarkModule_userId_moduleId_key" ON "BookmarkModule"("userId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseFeedback_userId_courseId_key" ON "CourseFeedback"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "EnrolledCourseProgress" ADD CONSTRAINT "EnrolledCourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrolledCourseProgress" ADD CONSTRAINT "EnrolledCourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkModule" ADD CONSTRAINT "BookmarkModule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkModule" ADD CONSTRAINT "BookmarkModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFeedback" ADD CONSTRAINT "CourseFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFeedback" ADD CONSTRAINT "CourseFeedback_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_enrolledCourseProgressId_fkey" FOREIGN KEY ("enrolledCourseProgressId") REFERENCES "EnrolledCourseProgress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_enrolledCourseProgressId_fkey" FOREIGN KEY ("enrolledCourseProgressId") REFERENCES "EnrolledCourseProgress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeAssessment" ADD CONSTRAINT "CodeAssessment_enrolledCourseProgressId_fkey" FOREIGN KEY ("enrolledCourseProgressId") REFERENCES "EnrolledCourseProgress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
