-- CreateTable
CREATE TABLE "public"."MessageEntry" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageEntry_messageId_idx" ON "public"."MessageEntry"("messageId");

-- AddForeignKey
ALTER TABLE "public"."MessageEntry" ADD CONSTRAINT "MessageEntry_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
