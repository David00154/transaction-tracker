/*
  Warnings:

  - You are about to drop the column `current_state` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tracking_number]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "current_state";

-- CreateTable
CREATE TABLE "status_point" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "status" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_point_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tracking_number_key" ON "transactions"("tracking_number");

-- AddForeignKey
ALTER TABLE "status_point" ADD CONSTRAINT "status_point_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
