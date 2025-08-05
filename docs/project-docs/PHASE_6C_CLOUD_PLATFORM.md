# Phase 6C: Cloud Platform Implementation Plan

## 📋 Overview

**Goal**: Build a scalable cloud platform that extends FlowScope's local-first capabilities with team collaboration, advanced analytics, and enterprise features.

**Timeline**: Week 14-16 (3 weeks)

**Priority**: Tertiary channel - provides value-added services for collaboration and advanced features

**Approach**: SaaS platform with tiered pricing - Individual, Team, and Enterprise tiers

---

## 🎯 Core Objectives

1. **Individual Sync**: Cross-device trace synchronization and backup
2. **Team Collaboration**: Shared workspaces and trace sharing
3. **Enterprise Features**: SSO, compliance, advanced analytics
4. **Revenue Generation**: Sustainable SaaS business model
5. **Privacy Preservation**: Encrypted data, user control, transparent policies

---

## 🏗️ System Architecture

### **High-Level Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Desktop App   │    │   VS Code Ext    │    │   Web Portal    │
│                 │    │                  │    │                 │
│ • Local Traces  │    │ • Code Context   │    │ • Team Mgmt     │
│ • Auto Sync     │◄──►│ • Trace Trigger  │◄──►│ • Analytics     │
│ • Offline Mode  │    │ • Real-time UI   │    │ • Billing       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │  Cloud Platform │
                         │                 │
                         │ • User Auth     │
                         │ • Data Sync     │
                         │ • Team Worksp   │
                         │ • Analytics     │
                         │ • Billing       │
                         └─────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
    ┌─────▼──────┐    ┌──────────▼───────────┐    ┌──────▼──────┐
    │ PostgreSQL │    │    Redis/Cache       │    │   S3/Blob   │
    │            │    │                      │    │             │
    │• User Data │    │ • Session Store      │    │ • Trace     │
    │• Metadata  │    │ • Real-time Events   │    │   Archives  │
    │• Analytics │    │ • Rate Limiting      │    │ • Assets    │
    └────────────┘    └──────────────────────┘    └─────────────┘
```

### **Tech Stack**

```yaml
Backend:
  Framework: Next.js 14 (App Router) + tRPC
  Database: PostgreSQL (Neon/PlanetScale)
  Cache: Redis (Upstash)
  Storage: AWS S3/Cloudflare R2
  Auth: NextAuth.js + Clerk
  Payments: Stripe
  Monitoring: Sentry + Posthog

Frontend:
  Framework: Next.js 14 + React 18
  Styling: Tailwind CSS
  Components: Radix UI + Shadcn/ui
  State: Zustand + React Query
  Charts: Recharts + D3.js

Infrastructure:
  Hosting: Vercel Pro
  CDN: Cloudflare
  Database: Neon (Postgres)
  Cache: Upstash (Redis)
  Storage: Cloudflare R2
  Monitoring: Vercel Analytics + Sentry
```

---

## 📊 Data Architecture

### **Core Database Schema**

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'individual', 'team', 'enterprise')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP,
    
    -- Billing
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(20),
    subscription_current_period_end TIMESTAMP,
    
    -- Usage tracking
    monthly_traces_used INTEGER DEFAULT 0,
    monthly_storage_used BIGINT DEFAULT 0,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb
);

-- Organizations/Teams
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier VARCHAR(20) DEFAULT 'team' CHECK (tier IN ('team', 'enterprise')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Enterprise features
    sso_domain VARCHAR(255),
    sso_enabled BOOLEAN DEFAULT FALSE,
    audit_log_retention_days INTEGER DEFAULT 90,
    
    -- Billing
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    max_seats INTEGER DEFAULT 5,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb
);

-- Organization memberships
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

-- Workspaces (can be personal or team-owned)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Workspace metadata
    project_type VARCHAR(50),
    git_repository TEXT,
    local_path TEXT,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb
);

-- Trace sessions
CREATE TABLE trace_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Session metadata
    framework VARCHAR(50),
    sdk_version VARCHAR(50),
    environment VARCHAR(50),
    git_commit VARCHAR(40),
    
    -- Aggregated metrics
    total_traces INTEGER DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb
);

-- Individual traces (metadata stored in DB, full data in object storage)
CREATE TABLE traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES trace_sessions(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Trace identification
    external_id VARCHAR(255), -- ID from SDK
    parent_id UUID REFERENCES traces(id) ON DELETE CASCADE,
    operation VARCHAR(255) NOT NULL,
    
    -- Timing
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error', 'timeout')),
    framework VARCHAR(50),
    model_name VARCHAR(100),
    
    -- Source location
    source_file TEXT,
    source_line INTEGER,
    source_function VARCHAR(255),
    
    -- Storage references
    trace_data_url TEXT, -- S3/R2 URL for full trace data
    data_size_bytes BIGINT,
    
    -- Quick access metadata (for fast queries)
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics and aggregations
CREATE TABLE daily_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Daily metrics
    total_traces INTEGER DEFAULT 0,
    unique_operations INTEGER DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    avg_duration_ms FLOAT DEFAULT 0,
    error_rate FLOAT DEFAULT 0,
    success_rate FLOAT DEFAULT 0,
    
    -- Model usage
    model_usage JSONB DEFAULT '{}'::jsonb, -- { "gpt-4": 150, "claude": 75 }
    
    -- Framework breakdown
    framework_usage JSONB DEFAULT '{}'::jsonb, -- { "langchain": 200, "llamaindex": 25 }
    
    UNIQUE(date, workspace_id)
);

-- Audit logs (for enterprise)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Shared traces/reports
CREATE TABLE shared_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(20) CHECK (item_type IN ('trace', 'session', 'report')),
    item_id UUID NOT NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Access control
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public', 'link')),
    access_token VARCHAR(255) UNIQUE, -- For link sharing
    expires_at TIMESTAMP,
    
    -- Metadata
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- API keys for desktop app sync
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(10) NOT NULL, -- First 8 chars for display
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    permissions TEXT[] DEFAULT ARRAY['read', 'write'],
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Indexes for Performance**

```sql
-- User and organization lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);

-- Workspace and trace queries
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_org ON workspaces(organization_id);
CREATE INDEX idx_trace_sessions_workspace ON trace_sessions(workspace_id);
CREATE INDEX idx_trace_sessions_user ON trace_sessions(user_id);

-- Trace lookups (most important for performance)
CREATE INDEX idx_traces_session ON traces(session_id);
CREATE INDEX idx_traces_workspace ON traces(workspace_id);
CREATE INDEX idx_traces_user ON traces(user_id);
CREATE INDEX idx_traces_started_at ON traces(started_at);
CREATE INDEX idx_traces_operation ON traces(operation);
CREATE INDEX idx_traces_status ON traces(status);
CREATE INDEX idx_traces_external_id ON traces(external_id);

-- Analytics queries
CREATE INDEX idx_daily_analytics_date_workspace ON daily_analytics(date, workspace_id);
CREATE INDEX idx_daily_analytics_date_org ON daily_analytics(date, organization_id);

-- Audit logs
CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);

-- Shared items
CREATE INDEX idx_shared_items_token ON shared_items(access_token);
CREATE INDEX idx_shared_items_workspace ON shared_items(workspace_id);

-- API keys
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

---

## 🔐 Authentication & Authorization

### **Authentication Flow**

```typescript
// NextAuth.js configuration
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import EmailProvider from "next-auth/providers/email"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user tier and organization info to session
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          organizationMembers: {
            include: { organization: true }
          }
        }
      });

      return {
        ...session,
        user: {
          ...session.user,
          id: dbUser?.id,
          tier: dbUser?.tier,
          organizations: dbUser?.organizationMembers.map(m => ({
            id: m.organization.id,
            name: m.organization.name,
            role: m.role
          }))
        }
      };
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  }
}
```

### **Authorization Middleware**

```typescript
// Role-based access control
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: User) => Promise<void>,
  options: {
    requiredTier?: 'free' | 'individual' | 'team' | 'enterprise';
    requiredRole?: 'member' | 'admin' | 'owner';
    organizationId?: string;
  } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getUserWithPermissions(session.user.id);
    
    // Check tier requirements
    if (options.requiredTier && !hasRequiredTier(user.tier, options.requiredTier)) {
      return res.status(403).json({ error: 'Insufficient subscription tier' });
    }

    // Check organization role
    if (options.organizationId && options.requiredRole) {
      const membership = user.organizationMembers.find(
        m => m.organizationId === options.organizationId
      );
      
      if (!membership || !hasRequiredRole(membership.role, options.requiredRole)) {
        return res.status(403).json({ error: 'Insufficient organization permissions' });
      }
    }

    return handler(req, res, user);
  };
}

// Desktop app API key authentication
export function withApiKey(
  handler: (req: NextApiRequest, res: NextApiResponse, user: User) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const keyHash = await hashApiKey(apiKey);
    const dbKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true }
    });

    if (!dbKey || (dbKey.expiresAt && dbKey.expiresAt < new Date())) {
      return res.status(401).json({ error: 'Invalid or expired API key' });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: dbKey.id },
      data: { lastUsedAt: new Date() }
    });

    return handler(req, res, dbKey.user);
  };
}
```

---

## 💰 Subscription & Billing

### **Stripe Integration**

```typescript
// Subscription management
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class BillingService {
  async createCheckoutSession(userId: string, priceId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Create or retrieve Stripe customer
    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email,
        metadata: { userId }
      });
      
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId,
      },
    });

    return session;
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        tier: this.getTierFromPriceId(subscription.items.data[0].price.id),
      },
    });
  }

  private getTierFromPriceId(priceId: string): string {
    const tierMap: Record<string, string> = {
      [process.env.STRIPE_INDIVIDUAL_PRICE_ID!]: 'individual',
      [process.env.STRIPE_TEAM_PRICE_ID!]: 'team',
      [process.env.STRIPE_ENTERPRISE_PRICE_ID!]: 'enterprise',
    };
    
    return tierMap[priceId] || 'free';
  }
}
```

### **Usage Tracking & Limits**

```typescript
// Usage tracking middleware
export class UsageTracker {
  async trackTraceUsage(userId: string, organizationId?: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const limits = this.getTierLimits(user?.tier || 'free');
    
    // Check monthly limits
    if (user && user.monthlyTracesUsed >= limits.maxTraces) {
      return false; // Limit exceeded
    }

    // Update usage
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyTracesUsed: { increment: 1 }
      }
    });

    return true;
  }

  async trackStorageUsage(userId: string, bytes: number): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const limits = this.getTierLimits(user?.tier || 'free');
    
    const newUsage = (user?.monthlyStorageUsed || 0) + bytes;
    if (newUsage > limits.maxStorage) {
      return false; // Limit exceeded
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyStorageUsed: newUsage
      }
    });

    return true;
  }

  private getTierLimits(tier: string) {
    const limits = {
      free: { maxTraces: 1000, maxStorage: 100 * 1024 * 1024 }, // 100MB
      individual: { maxTraces: 50000, maxStorage: 10 * 1024 * 1024 * 1024 }, // 10GB
      team: { maxTraces: 200000, maxStorage: 100 * 1024 * 1024 * 1024 }, // 100GB
      enterprise: { maxTraces: Infinity, maxStorage: Infinity }
    };
    
    return limits[tier as keyof typeof limits] || limits.free;
  }

  // Reset monthly usage (run via cron job)
  async resetMonthlyUsage(): Promise<void> {
    await prisma.user.updateMany({
      data: {
        monthlyTracesUsed: 0,
        monthlyStorageUsed: 0
      }
    });
  }
}
```

---

## 🌐 API Architecture

### **tRPC Router Setup**

```typescript
// Main tRPC router
import { router } from '../trpc';
import { authRouter } from './auth';
import { workspaceRouter } from './workspace';
import { traceRouter } from './trace';
import { analyticsRouter } from './analytics';
import { billingRouter } from './billing';
import { organizationRouter } from './organization';

export const appRouter = router({
  auth: authRouter,
  workspace: workspaceRouter,
  trace: traceRouter,
  analytics: analyticsRouter,
  billing: billingRouter,
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
```

### **Trace Management Router**

```typescript
// Trace operations
export const traceRouter = router({
  // Upload trace from desktop app
  upload: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      workspaceId: z.string().uuid(),
      traceData: z.object({
        operation: z.string(),
        startedAt: z.date(),
        completedAt: z.date().optional(),
        status: z.enum(['pending', 'success', 'error', 'timeout']),
        framework: z.string(),
        modelName: z.string().optional(),
        sourceFile: z.string().optional(),
        sourceLine: z.number().optional(),
        data: z.record(z.any()), // Full trace data
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check usage limits
      const canUpload = await usageTracker.trackTraceUsage(ctx.user.id);
      if (!canUpload) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Monthly trace limit exceeded. Upgrade your plan for more traces.',
        });
      }

      // Store full trace data in S3/R2
      const traceDataUrl = await uploadTraceData(input.traceData.data);
      const dataSize = JSON.stringify(input.traceData.data).length;

      // Check storage limits
      const canStore = await usageTracker.trackStorageUsage(ctx.user.id, dataSize);
      if (!canStore) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Storage limit exceeded. Upgrade your plan for more storage.',
        });
      }

      // Create trace record
      const trace = await ctx.prisma.trace.create({
        data: {
          sessionId: input.sessionId,
          workspaceId: input.workspaceId,
          userId: ctx.user.id,
          operation: input.traceData.operation,
          startedAt: input.traceData.startedAt,
          completedAt: input.traceData.completedAt,
          status: input.traceData.status,
          framework: input.traceData.framework,
          modelName: input.traceData.modelName,
          sourceFile: input.traceData.sourceFile,
          sourceLine: input.traceData.sourceLine,
          traceDataUrl,
          dataSizeBytes: dataSize,
          durationMs: input.traceData.completedAt
            ? input.traceData.completedAt.getTime() - input.traceData.startedAt.getTime()
            : null,
        },
      });

      // Update session aggregates
      await this.updateSessionAggregates(input.sessionId);

      return trace;
    }),

  // Get traces for workspace
  list: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      limit: z.number().default(50),
      offset: z.number().default(0),
      filter: z.object({
        status: z.enum(['pending', 'success', 'error', 'timeout']).optional(),
        operation: z.string().optional(),
        dateRange: z.object({
          from: z.date(),
          to: z.date(),
        }).optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check workspace access
      await this.checkWorkspaceAccess(ctx.user.id, input.workspaceId);

      const where = {
        workspaceId: input.workspaceId,
        ...(input.filter?.status && { status: input.filter.status }),
        ...(input.filter?.operation && { operation: { contains: input.filter.operation } }),
        ...(input.filter?.dateRange && {
          startedAt: {
            gte: input.filter.dateRange.from,
            lte: input.filter.dateRange.to,
          },
        }),
      };

      const [traces, total] = await Promise.all([
        ctx.prisma.trace.findMany({
          where,
          orderBy: { startedAt: 'desc' },
          take: input.limit,
          skip: input.offset,
          select: {
            id: true,
            operation: true,
            startedAt: true,
            completedAt: true,
            durationMs: true,
            status: true,
            framework: true,
            modelName: true,
            sourceFile: true,
            sourceLine: true,
            // Don't include full data URL for list view
          },
        }),
        ctx.prisma.trace.count({ where }),
      ]);

      return { traces, total };
    }),

  // Get full trace details
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const trace = await ctx.prisma.trace.findUnique({
        where: { id: input.id },
        include: {
          workspace: true,
          session: true,
        },
      });

      if (!trace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Trace not found',
        });
      }

      // Check access
      await this.checkWorkspaceAccess(ctx.user.id, trace.workspaceId);

      // Fetch full trace data from storage
      let fullData = null;
      if (trace.traceDataUrl) {
        fullData = await downloadTraceData(trace.traceDataUrl);
      }

      return {
        ...trace,
        fullData,
      };
    }),

  // Sync traces from desktop app
  sync: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      lastSyncAt: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await this.checkWorkspaceAccess(ctx.user.id, input.workspaceId);

      const where = {
        workspaceId: input.workspaceId,
        ...(input.lastSyncAt && {
          updatedAt: { gt: input.lastSyncAt },
        }),
      };

      return await ctx.prisma.trace.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 1000, // Limit sync batch size
      });
    }),
});
```

---

## 🎨 Frontend Implementation

### **Main Dashboard Layout**

```tsx
// Dashboard layout with sidebar navigation
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { data: workspaces } = trpc.workspace.list.useQuery();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900">FlowScope</h1>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Workspaces
            </h2>
          </div>
          
          {workspaces?.map(workspace => (
            <Link
              key={workspace.id}
              href={`/workspace/${workspace.id}`}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FolderIcon className="w-4 h-4 mr-3" />
              {workspace.name}
            </Link>
          ))}
          
          <div className="mt-8 px-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Tools
            </h2>
            
            <Link href="/analytics" className="flex items-center px-0 py-2 text-sm text-gray-700 hover:text-gray-900">
              <ChartBarIcon className="w-4 h-4 mr-3" />
              Analytics
            </Link>
            
            <Link href="/team" className="flex items-center px-0 py-2 text-sm text-gray-700 hover:text-gray-900">
              <UsersIcon className="w-4 h-4 mr-3" />
              Team
            </Link>
            
            <Link href="/settings" className="flex items-center px-0 py-2 text-sm text-gray-700 hover:text-gray-900">
              <CogIcon className="w-4 h-4 mr-3" />
              Settings
            </Link>
          </div>
        </nav>
        
        {/* Upgrade prompt for free users */}
        {session?.user.tier === 'free' && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-2">
                Upgrade for unlimited traces and team collaboration
              </p>
              <Link
                href="/pricing"
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Upgrade
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

### **Workspace Overview Page**

```tsx
// Workspace dashboard with recent traces and analytics
export default function WorkspacePage({ params }: { params: { id: string } }) {
  const { data: workspace } = trpc.workspace.get.useQuery({ id: params.id });
  const { data: recentTraces } = trpc.trace.list.useQuery({ 
    workspaceId: params.id,
    limit: 10 
  });
  const { data: analytics } = trpc.analytics.workspace.useQuery({ 
    workspaceId: params.id,
    period: '7d'
  });

  if (!workspace) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
        <p className="text-gray-600">{workspace.description}</p>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Traces"
          value={analytics?.totalTraces?.toLocaleString() || '0'}
          change="+12% from last week"
          trend="up"
        />
        <StatCard
          title="Avg Duration"
          value={`${analytics?.avgDuration || 0}ms`}
          change="-5% from last week"
          trend="down"
        />
        <StatCard
          title="Success Rate"
          value={`${((analytics?.successRate || 0) * 100).toFixed(1)}%`}
          change="+2% from last week"
          trend="up"
        />
        <StatCard
          title="Active Sessions"
          value={analytics?.activeSessions?.toString() || '0'}
          change="3 ongoing"
          trend="neutral"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Trace Volume</h3>
          <TraceVolumeChart data={analytics?.dailyVolume || []} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Performance Trends</h3>
          <PerformanceChart data={analytics?.performanceTrends || []} />
        </div>
      </div>
      
      {/* Recent traces */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Recent Traces</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTraces?.traces.map(trace => (
                <tr key={trace.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/workspace/${params.id}/trace/${trace.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {trace.operation}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trace.durationMs ? `${trace.durationMs}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={trace.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(trace.startedAt)} ago
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 Analytics & Insights

### **Advanced Analytics Engine**

```typescript
// Analytics service for complex queries
export class AnalyticsService {
  async getWorkspaceAnalytics(workspaceId: string, period: string) {
    const dateRange = this.getPeriodDateRange(period);
    
    // Parallel queries for different metrics
    const [
      dailyStats,
      operationBreakdown,
      performanceTrends,
      errorAnalysis,
      modelUsage
    ] = await Promise.all([
      this.getDailyStats(workspaceId, dateRange),
      this.getOperationBreakdown(workspaceId, dateRange),
      this.getPerformanceTrends(workspaceId, dateRange),
      this.getErrorAnalysis(workspaceId, dateRange),
      this.getModelUsage(workspaceId, dateRange)
    ]);

    return {
      dailyStats,
      operationBreakdown,
      performanceTrends,
      errorAnalysis,
      modelUsage,
      summary: this.calculateSummaryMetrics(dailyStats)
    };
  }

  private async getDailyStats(workspaceId: string, dateRange: DateRange) {
    return await prisma.$queryRaw`
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as total_traces,
        AVG(duration_ms) as avg_duration,
        COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate,
        COUNT(*) FILTER (WHERE status = 'error') as error_count,
        COUNT(DISTINCT operation) as unique_operations
      FROM traces 
      WHERE workspace_id = ${workspaceId} 
        AND started_at >= ${dateRange.from} 
        AND started_at <= ${dateRange.to}
      GROUP BY DATE(started_at)
      ORDER BY date DESC
    `;
  }

  private async getOperationBreakdown(workspaceId: string, dateRange: DateRange) {
    return await prisma.$queryRaw`
      SELECT 
        operation,
        COUNT(*) as trace_count,
        AVG(duration_ms) as avg_duration,
        MIN(duration_ms) as min_duration,
        MAX(duration_ms) as max_duration,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
        COUNT(*) FILTER (WHERE status = 'error') * 100.0 / COUNT(*) as error_rate
      FROM traces 
      WHERE workspace_id = ${workspaceId} 
        AND started_at >= ${dateRange.from} 
        AND started_at <= ${dateRange.to}
        AND duration_ms IS NOT NULL
      GROUP BY operation
      ORDER BY trace_count DESC
      LIMIT 20
    `;
  }

  private async getPerformanceTrends(workspaceId: string, dateRange: DateRange) {
    return await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', started_at) as hour,
        operation,
        AVG(duration_ms) as avg_duration,
        COUNT(*) as trace_count
      FROM traces 
      WHERE workspace_id = ${workspaceId} 
        AND started_at >= ${dateRange.from} 
        AND started_at <= ${dateRange.to}
        AND duration_ms IS NOT NULL
      GROUP BY DATE_TRUNC('hour', started_at), operation
      ORDER BY hour DESC
    `;
  }

  // Cost analysis (if model pricing data available)
  async getCostAnalysis(workspaceId: string, period: string) {
    const dateRange = this.getPeriodDateRange(period);
    
    return await prisma.$queryRaw`
      SELECT 
        model_name,
        COUNT(*) as usage_count,
        SUM(
          CASE model_name 
            WHEN 'gpt-4' THEN 0.03 * (metadata->>'input_tokens')::int / 1000.0 + 0.06 * (metadata->>'output_tokens')::int / 1000.0
            WHEN 'gpt-3.5-turbo' THEN 0.001 * (metadata->>'input_tokens')::int / 1000.0 + 0.002 * (metadata->>'output_tokens')::int / 1000.0
            WHEN 'claude-3-opus' THEN 0.015 * (metadata->>'input_tokens')::int / 1000.0 + 0.075 * (metadata->>'output_tokens')::int / 1000.0
            ELSE 0
          END
        ) as estimated_cost
      FROM traces 
      WHERE workspace_id = ${workspaceId} 
        AND started_at >= ${dateRange.from} 
        AND started_at <= ${dateRange.to}
        AND model_name IS NOT NULL
        AND metadata->>'input_tokens' IS NOT NULL
      GROUP BY model_name
      ORDER BY estimated_cost DESC
    `;
  }
}
```

---

## 🚀 Deployment & Infrastructure

### **Vercel Deployment Configuration**

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "STRIPE_SECRET_KEY": "@stripe-secret",
    "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret"
  }
}
```

### **Database Migration Strategy**

```sql
-- Migration script for production deployment
-- Phase 1: Core tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users and auth (already defined above)
-- Organizations and workspaces (already defined above)
-- Traces and sessions (already defined above)

-- Phase 2: Indexes for performance
-- (All indexes defined above)

-- Phase 3: Seed data
INSERT INTO organizations (id, name, slug, tier, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'FlowScope Team', 'flowscope-team', 'enterprise', NOW());

-- Phase 4: Analytics views for complex queries
CREATE VIEW workspace_analytics AS
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  COUNT(t.id) as total_traces,
  AVG(t.duration_ms) as avg_duration,
  COUNT(*) FILTER (WHERE t.status = 'success') * 100.0 / COUNT(*) as success_rate,
  MIN(t.started_at) as first_trace_at,
  MAX(t.started_at) as last_trace_at
FROM workspaces w
LEFT JOIN traces t ON w.id = t.workspace_id
GROUP BY w.id, w.name;
```

---

## 🔒 Security & Compliance

### **Data Encryption**

```typescript
// Encryption utilities for sensitive data
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private secretKey = process.env.ENCRYPTION_SECRET!;

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, Buffer.from(this.secretKey, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = createDecipheriv(this.algorithm, Buffer.from(this.secretKey, 'hex'), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Encrypt sensitive trace data before storage
export async function encryptTraceData(data: any): Promise<string> {
  const encryption = new EncryptionService();
  const dataString = JSON.stringify(data);
  const { encrypted, iv, tag } = encryption.encrypt(dataString);
  
  // Store encryption metadata with the data
  return JSON.stringify({ encrypted, iv, tag, version: 1 });
}
```

### **GDPR Compliance**

```typescript
// Data export and deletion for GDPR compliance
export class ComplianceService {
  async exportUserData(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspaces: {
          include: {
            traces: true,
            sessions: true
          }
        },
        organizationMembers: {
          include: { organization: true }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Compile all user data
    const exportData = {
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        tier: user.tier
      },
      workspaces: user.workspaces.map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        createdAt: workspace.createdAt,
        traceCount: workspace.traces.length,
        sessionCount: workspace.sessions.length
      })),
      organizations: user.organizationMembers.map(member => ({
        organization: member.organization.name,
        role: member.role,
        joinedAt: member.joinedAt
      })),
      usage: {
        monthlyTracesUsed: user.monthlyTracesUsed,
        monthlyStorageUsed: user.monthlyStorageUsed
      }
    };

    return exportData;
  }

  async deleteUserData(userId: string): Promise<void> {
    // Delete in correct order to respect foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete traces (will also delete from S3/R2)
      const traces = await tx.trace.findMany({
        where: { userId },
        select: { traceDataUrl: true }
      });

      for (const trace of traces) {
        if (trace.traceDataUrl) {
          await deleteFromStorage(trace.traceDataUrl);
        }
      }

      await tx.trace.deleteMany({ where: { userId } });
      
      // Delete sessions
      await tx.traceSession.deleteMany({ where: { userId } });
      
      // Delete workspaces (only if owner)
      await tx.workspace.deleteMany({ where: { ownerId: userId } });
      
      // Remove from organizations
      await tx.organizationMember.deleteMany({ where: { userId } });
      
      // Delete API keys
      await tx.apiKey.deleteMany({ where: { userId } });
      
      // Delete user
      await tx.user.delete({ where: { id: userId } });
    });
  }
}
```

---

## 📈 Success Metrics & KPIs

### **Technical Metrics**
- [ ] API response time < 200ms (95th percentile)
- [ ] Database query time < 50ms average
- [ ] 99.9% uptime SLA
- [ ] Zero data loss incidents

### **Business Metrics**
- [ ] 1000+ Individual tier signups in first quarter
- [ ] 100+ Team tier customers by month 6
- [ ] 10+ Enterprise customers by year 1
- [ ] $10K+ MRR by month 6
- [ ] 85% customer retention rate

### **User Experience Metrics**
- [ ] 90% successful desktop app sync rate
- [ ] < 5 second time to first trace visualization
- [ ] 4.5+ star average user rating
- [ ] 80% feature adoption rate

---

This cloud platform serves as the collaboration and advanced analytics layer for FlowScope, enabling teams to work together while maintaining the privacy-first approach that makes FlowScope unique in the LLM observability space.
