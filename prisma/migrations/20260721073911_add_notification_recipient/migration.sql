-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
