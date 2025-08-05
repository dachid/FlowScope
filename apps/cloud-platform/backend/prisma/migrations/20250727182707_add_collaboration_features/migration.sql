-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'developer',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "permissions" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,
    CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT,
    "ownerId" TEXT NOT NULL,
    "settings" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "projects_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareToken" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "projectId" TEXT,
    "permissions" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" DATETIME,
    CONSTRAINT "share_links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "share_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "projectId" TEXT,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "position" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "color" TEXT DEFAULT '#FFD700',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "annotations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "presence_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "cursor" TEXT,
    "selection" TEXT,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "presence_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "prompts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prompt_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "message" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT,
    CONSTRAINT "prompt_versions_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prompt_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "prompt_versions_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "prompt_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT,
    "userId" TEXT,
    "projectId" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trace_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "metadata" TEXT,
    "parentId" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "trace_data_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trace_data_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "trace_data" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chain_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "promptId" TEXT,
    "promptVersionId" TEXT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" TEXT NOT NULL,
    "output" TEXT,
    "error" TEXT,
    "metadata" TEXT,
    "tokenUsage" TEXT,
    CONSTRAINT "chain_executions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chain_executions_promptVersionId_fkey" FOREIGN KEY ("promptVersionId") REFERENCES "prompt_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_userId_teamId_key" ON "team_members"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_shareToken_key" ON "share_links"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "presence_records_userId_resourceType_resourceId_key" ON "presence_records"("userId", "resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_versions_promptId_version_key" ON "prompt_versions"("promptId", "version");
