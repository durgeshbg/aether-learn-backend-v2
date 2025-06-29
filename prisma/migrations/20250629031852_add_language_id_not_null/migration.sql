/*
  Warnings:

  - Made the column `languageId` on table `Module` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Module" ALTER COLUMN "languageId" SET NOT NULL;
