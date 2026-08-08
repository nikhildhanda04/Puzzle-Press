-- AlterTable
ALTER TABLE "Issue" ALTER COLUMN "theme" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "sourceStory" TEXT NOT NULL DEFAULT '';
