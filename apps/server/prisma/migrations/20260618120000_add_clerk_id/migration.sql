-- AlterTable
ALTER TABLE "User" ADD COLUMN "clerkId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
