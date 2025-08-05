-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'auto',
    "rightPanelTab" TEXT NOT NULL DEFAULT 'details',
    "rightPanelCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "sidebarCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "autoOpenPanelOnNodeClick" BOOLEAN NOT NULL DEFAULT true,
    "defaultSessionView" TEXT NOT NULL DEFAULT 'grid',
    "tracePageSize" INTEGER NOT NULL DEFAULT 25,
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "autoSave" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "color" TEXT DEFAULT '#FFD700',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookmarks_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "trace_data" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_traceId_key" ON "bookmarks"("userId", "traceId");
