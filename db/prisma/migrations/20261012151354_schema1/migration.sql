/*
  Warnings:

  - Added the required column `ttl` to the `ReservedItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReservedItem" ADD COLUMN     "ttl" TIMESTAMP(3) NOT NULL;
