-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "descriptionBanner" TEXT,
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "specs" JSONB;
