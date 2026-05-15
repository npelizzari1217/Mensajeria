-- CreateTable
CREATE TABLE "user_pinned_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "pinned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pinned_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_pinned_messages_user_id_idx" ON "user_pinned_messages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_pinned_messages_user_id_message_id_key" ON "user_pinned_messages"("user_id", "message_id");

-- AddForeignKey
ALTER TABLE "user_pinned_messages" ADD CONSTRAINT "user_pinned_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pinned_messages" ADD CONSTRAINT "user_pinned_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;
