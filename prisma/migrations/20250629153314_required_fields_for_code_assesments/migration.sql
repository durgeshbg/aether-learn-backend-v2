/*
  Warnings:

  - Made the column `description` on table `CodeAssessment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instructions` on table `CodeAssessment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `starterCode` on table `CodeAssessment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `languageId` on table `CodeAssessment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CodeAssessment" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "instructions" SET NOT NULL,
ALTER COLUMN "starterCode" SET NOT NULL,
ALTER COLUMN "languageId" SET NOT NULL;
