/*
  Warnings:

  - Added the required column `fullname` to the `EmployeeProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeProfile" ADD COLUMN     "fullname" TEXT NOT NULL;
