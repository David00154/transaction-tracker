-- DropForeignKey
ALTER TABLE "status_point" DROP CONSTRAINT "status_point_transactionId_fkey";

-- AddForeignKey
ALTER TABLE "status_point" ADD CONSTRAINT "status_point_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
