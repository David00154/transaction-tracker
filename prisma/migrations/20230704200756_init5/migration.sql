-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "amount" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reciever" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "session_id" TEXT NOT NULL DEFAULT '';
