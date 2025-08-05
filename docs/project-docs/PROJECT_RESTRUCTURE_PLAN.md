# FlowScope Project Restructuring Plan

## 🎯 Overview

This document outlines the cleanup and restructuring process to prepare FlowScope for Phase 6 implementation while preserving valuable SDK and backend work.

## 📋 Current Asset Analysis

### ✅ **Reusable Assets** (Keep & Enhance)
- `packages/shared/` - Core types and utilities ✅
- `packages/javascript-sdk/` - LangChain/LlamaIndex integration ✅  
- `packages/python-sdk/` - Python LLM framework integration ✅
- `packages/backend/` - NestJS API server with Prisma ✅
- Root configuration (tsconfig, eslint, prettier) ✅

### 🔄 **Transform for New Architecture**
- `packages/web-app/` → `apps/cloud-platform/` (Next.js SaaS platform with backend)
- `packages/vscode-extension/` → `apps/vscode-extension/` (Standalone IDE tool)

### 📦 **Move to Legacy** (Backup unused packages)
- `packages/browser-extension/` → `legacy/browser-extension/` (Not in Phase 6 scope)
- `packages/sdk/` → `legacy/sdk/` (Duplicate/outdated SDK)

### 🆕 **New Channels to Create**
- `apps/desktop-app/` - Electron desktop application (Primary channel, fully local)

### 🤔 **Architecture Decisions to Make**
- **Shared Package**: Keep centralized OR distribute core types to each app for true independence?
- **Backend Scope**: Only serves cloud platform, desktop/VS Code are fully local
- **Integration**: Cross-channel messaging logic embedded in each app, not separate service

## 🏗️ **Target Structure Options**

### **Option A: Centralized Shared (Current Monorepo)**
```
flowscope/
├── apps/                          # Independent applications
│   ├── desktop-app/              # Electron app (Primary, fully local)
│   ├── vscode-extension/         # VS Code companion (local + desktop integration)
│   └── cloud-platform/          # Next.js SaaS + NestJS backend
├── packages/                     # Shared packages & SDKs
│   ├── shared/                   # Core types & utilities (used by all)
│   ├── javascript-sdk/           # JS/TS LLM integration
│   └── python-sdk/              # Python LLM integration
├── legacy/                       # Archived packages
└── docs/                         # Phase 6 implementation docs
```

### **Option B: Distributed Types (True Independence)**
```
flowscope/
├── apps/
│   ├── desktop-app/              # Contains own types, SQLite, Electron
│   │   └── src/types/           # App-specific types
│   ├── vscode-extension/         # Contains own types, minimal footprint
│   │   └── src/types/           # App-specific types  
│   └── cloud-platform/          # Contains backend + types, PostgreSQL
│       ├── backend/             # NestJS API (moved here)
│       └── frontend/            # Next.js SaaS
├── packages/                     # SDK packages only
│   ├── javascript-sdk/           # Self-contained
│   └── python-sdk/              # Self-contained
└── legacy/
```

## 🔄 **Migration Benefits**

### **Option A Benefits (Centralized Shared)**
1. **DRY Principle**: Single source of truth for types
2. **Consistency**: All apps use same interfaces
3. **Easy Updates**: Change types once, affects all apps
4. **Monorepo Benefits**: Lerna dependency management

### **Option B Benefits (Distributed Types)**
1. **True Independence**: Each app can evolve separately
2. **No Dependencies**: Apps don't depend on shared packages
3. **Deployment Freedom**: Deploy any app without others
4. **Channel Autonomy**: Teams can work independently

## 🤔 **Recommendation**

**Start with Option A** for faster Phase 6 implementation, then **migrate to Option B** for production:

1. **Phase 6A-D**: Use centralized shared for rapid prototyping
2. **Phase 6E**: Distribute types for production independence
3. **Integration**: Message protocols embedded in each app, not centralized service

## 📦 **Revised Package Dependencies**

### **Apps Dependencies (Option A)**
```json
{
  "apps/desktop-app": ["@flowscope/shared", "@flowscope/javascript-sdk"],
  "apps/vscode-extension": ["@flowscope/shared"],
  "apps/cloud-platform": ["@flowscope/shared"] // backend moved into this app
}
```

### **Channel Communication**
- **Desktop ↔ VS Code**: Local HTTP/WebSocket (ports 31847-31848)
- **Desktop ↔ Cloud**: REST API + WebSocket (when user opts in)
- **VS Code ↔ Cloud**: Via Desktop App relay (no direct connection)
- **Integration Logic**: Embedded in each app, not separate service

## ✅ **Validation Criteria**

After restructuring, each app should:
- [ ] Build independently (`npm run build`)
- [ ] Run independently (`npm run dev`)
- [ ] Have clear dependency boundaries
- [ ] Maintain existing SDK functionality
- [ ] Support independent deployment

---

Ready to execute this plan? The restructuring will preserve all valuable work while creating the foundation for Phase 6 implementation.
