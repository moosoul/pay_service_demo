-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'succeeded', 'failed', 'expired', 'refund_partial_pending', 'refund_partial_failed', 'refund_partial_succeeded', 'refund_pending', 'refund_failed', 'refund_succeeded');

-- CreateEnum
CREATE TYPE "TransactionRefundStatus" AS ENUM ('pending', 'failed', 'succeeded');

-- CreateEnum
CREATE TYPE "StripePaymentDataType" AS ENUM ('checkout_session', 'payment_intent', 'charge', 'refund');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "no" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "refundedAmount" INTEGER,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "failedReason" TEXT,
    "refundReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "stripePaymentStatus" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_refunds" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "TransactionRefundStatus" NOT NULL DEFAULT 'pending',
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "transaction_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_records" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "source" JSONB NOT NULL,
    "target" JSONB NOT NULL,

    CONSTRAINT "transaction_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_on_transactions" (
    "id" TEXT NOT NULL,
    "productAmount" INTEGER NOT NULL,
    "productCurrency" TEXT NOT NULL,
    "productQuantity" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "productId" TEXT NOT NULL,
    "productMetadata" JSONB,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "product_on_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "stripe_payment_datas" (
    "id" TEXT NOT NULL,
    "type" "StripePaymentDataType" NOT NULL,
    "transactionId" TEXT NOT NULL,
    "requestMetadata" JSONB,
    "responseMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "stripe_payment_datas_pkey" PRIMARY KEY ("id","type")
);

-- CreateTable
CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "created" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id","type")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_no_key" ON "transactions"("no");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transaction_refunds_transactionId_idx" ON "transaction_refunds"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_records_transactionId_idx" ON "transaction_records"("transactionId");

-- CreateIndex
CREATE INDEX "products_currencyCode_idx" ON "products"("currencyCode");

-- CreateIndex
CREATE INDEX "product_on_transactions_productId_idx" ON "product_on_transactions"("productId");

-- CreateIndex
CREATE INDEX "product_on_transactions_transactionId_idx" ON "product_on_transactions"("transactionId");

-- CreateIndex
CREATE INDEX "stripe_payment_datas_transactionId_idx" ON "stripe_payment_datas"("transactionId");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_transactionId_idx" ON "stripe_webhook_events"("transactionId");
