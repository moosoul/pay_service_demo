/*
  Warnings:

  - Added the required column `userId` to the `product_on_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_on_transactions" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "product_on_transactions_userId_idx" ON "product_on_transactions"("userId");
