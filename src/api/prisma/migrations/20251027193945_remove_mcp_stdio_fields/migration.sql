/*
  Warnings:

  - You are about to drop the column `args` on the `mcps` table. All the data in the column will be lost.
  - You are about to drop the column `command` on the `mcps` table. All the data in the column will be lost.
  - Made the column `url` on table `mcps` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "mcps" DROP COLUMN "args",
DROP COLUMN "command",
ALTER COLUMN "url" SET NOT NULL;
