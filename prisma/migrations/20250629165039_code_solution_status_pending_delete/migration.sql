/*
  Warnings:

  - The values [PENDING] on the enum `CodeSolutionStatus` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `score` on table `CodeSolution` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CodeSolutionStatus_new" AS ENUM ('SUBMITTED', 'GRADED');
ALTER TABLE "CodeSolution" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CodeSolution" ALTER COLUMN "status" TYPE "CodeSolutionStatus_new" USING ("status"::text::"CodeSolutionStatus_new");
ALTER TYPE "CodeSolutionStatus" RENAME TO "CodeSolutionStatus_old";
ALTER TYPE "CodeSolutionStatus_new" RENAME TO "CodeSolutionStatus";
DROP TYPE "CodeSolutionStatus_old";
ALTER TABLE "CodeSolution" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterTable
ALTER TABLE "CodeSolution" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED',
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "score" SET DEFAULT 0;
