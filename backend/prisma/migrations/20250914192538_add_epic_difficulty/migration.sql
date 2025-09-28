/*
  Warnings:

  - You are about to drop the `analytics_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `badge_requirements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `challenge_leaderboard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `challenge_participants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `challenge_quests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `challenge_rewards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `challenges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `friendships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `xp_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `encourageSharing` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `isEpic` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `moderatedAt` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `moderatedBy` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `flaggedAt` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `flaggedBy` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `moderationFlags` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `autoAcceptFriendRequests` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `badgeNotifications` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `challengeNotifications` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `newQuestNotifications` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `shareCompletions` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `showBadges` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `showLocation` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `showStreak` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `socialNotifications` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `streakReminders` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `timeAvailablePerDay` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `currentStreak` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `longestStreak` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalPoints` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "badges_name_key";

-- DropIndex
DROP INDEX "challenge_leaderboard_challengeId_userId_key";

-- DropIndex
DROP INDEX "challenge_participants_challengeId_userId_key";

-- DropIndex
DROP INDEX "challenge_quests_challengeId_questId_key";

-- DropIndex
DROP INDEX "friendships_initiatorId_receiverId_key";

-- DropIndex
DROP INDEX "likes_userId_commentId_key";

-- DropIndex
DROP INDEX "likes_userId_submissionId_key";

-- DropIndex
DROP INDEX "user_badges_userId_badgeId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "analytics_events";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "badge_requirements";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "badges";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "challenge_leaderboard";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "challenge_participants";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "challenge_quests";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "challenge_rewards";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "challenges";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "comments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "friendships";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "likes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "reports";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "system_logs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "user_badges";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "xp_logs";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "instructions" TEXT,
    "categoryId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "requirements" JSONB NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "submissionTypes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "locationRequired" BOOLEAN NOT NULL DEFAULT false,
    "locationType" TEXT,
    "specificLocation" TEXT,
    "allowSharing" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdBy" TEXT,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "quests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "quest_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quests_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_quests" ("allowSharing", "averageRating", "categoryId", "completionCount", "createdAt", "createdBy", "description", "difficulty", "estimatedTime", "id", "imageUrl", "instructions", "isFeatured", "locationRequired", "locationType", "publishedAt", "ratingCount", "requirements", "shortDescription", "specificLocation", "status", "submissionTypes", "tags", "title", "updatedAt") SELECT "allowSharing", "averageRating", "categoryId", "completionCount", "createdAt", "createdBy", "description", "difficulty", "estimatedTime", "id", "imageUrl", "instructions", "isFeatured", "locationRequired", "locationType", "publishedAt", "ratingCount", "requirements", "shortDescription", "specificLocation", "status", "submissionTypes", "tags", "title", "updatedAt" FROM "quests";
DROP TABLE "quests";
ALTER TABLE "new_quests" RENAME TO "quests";
CREATE TABLE "new_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "caption" TEXT NOT NULL,
    "textContent" TEXT,
    "mediaUrls" JSONB,
    "checklistData" JSONB,
    "latitude" REAL,
    "longitude" REAL,
    "address" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "submissions_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_submissions" ("address", "approvedAt", "approvedBy", "caption", "checklistData", "id", "latitude", "longitude", "mediaUrls", "privacy", "questId", "rejectionReason", "status", "submittedAt", "textContent", "type", "updatedAt", "userId") SELECT "address", "approvedAt", "approvedBy", "caption", "checklistData", "id", "latitude", "longitude", "mediaUrls", "privacy", "questId", "rejectionReason", "status", "submittedAt", "textContent", "type", "updatedAt", "userId" FROM "submissions";
DROP TABLE "submissions";
ALTER TABLE "new_submissions" RENAME TO "submissions";
CREATE TABLE "new_user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "profileVisibility" TEXT NOT NULL DEFAULT 'public',
    "preferredCategories" JSONB NOT NULL,
    "preferredDifficulty" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_preferences" ("createdAt", "emailNotifications", "id", "preferredCategories", "preferredDifficulty", "profileVisibility", "pushNotifications", "updatedAt", "userId") SELECT "createdAt", "emailNotifications", "id", "preferredCategories", "preferredDifficulty", "profileVisibility", "pushNotifications", "updatedAt", "userId" FROM "user_preferences";
DROP TABLE "user_preferences";
ALTER TABLE "new_user_preferences" RENAME TO "user_preferences";
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_users" ("avatar", "bio", "createdAt", "email", "emailVerificationToken", "emailVerified", "firstName", "id", "isActive", "lastActiveAt", "lastName", "passwordHash", "passwordResetExpires", "passwordResetToken", "role", "updatedAt", "username") SELECT "avatar", "bio", "createdAt", "email", "emailVerificationToken", "emailVerified", "firstName", "id", "isActive", "lastActiveAt", "lastName", "passwordHash", "passwordResetExpires", "passwordResetToken", "role", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
