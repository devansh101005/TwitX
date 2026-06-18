-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN "voiceSamples" TEXT[] DEFAULT ARRAY[]::TEXT[];
