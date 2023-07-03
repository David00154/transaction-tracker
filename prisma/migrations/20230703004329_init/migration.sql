-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "current_state" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);
