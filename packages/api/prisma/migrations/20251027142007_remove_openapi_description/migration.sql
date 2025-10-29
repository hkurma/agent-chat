/*
  Warnings:

  - You are about to drop the column `description` on the `openapis` table. All the data in the column will be lost.
  - Made the column `embedding` on table `document_chunks` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tools_schema` on table `openapis` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "document_chunks" ALTER COLUMN "embedding" SET NOT NULL;

-- AlterTable
ALTER TABLE "openapis" DROP COLUMN "description",
ALTER COLUMN "tools_schema" SET NOT NULL;
