/*
  Warnings:

  - You are about to drop the column `userId` on the `product_on_transactions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "product_on_transactions_userId_idx";

-- AlterTable
ALTER TABLE "product_on_transactions" DROP COLUMN "userId";
