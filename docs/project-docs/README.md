# FlowScope

FlowScope is a cross-platform debugger and observability tool designed for developers working with Large Language Models (LLMs). It provides comprehensive debugging, tracing, and prompt management functionalities across popular frameworks like LangChain, LlamaIndex, Flowise, AutoGen, and CrewAI.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git

### Installation & Setup

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd FlowScope
   npm run setup
   ```

2. **Start the development environment:**
   ```bash
   npm run dev
   ```

This will start:
- Backend API server on `http://localhost:3000`
- Frontend web app on `http://localhost:5173`
- All package development servers in watch mode

### Project Structure

```
flowscope/
├── packages/
│   ├── shared/                 # Shared types and utilities
│   ├── backend/               # NestJS backend API
│   ├── web-app/              # React web application
│   ├── sdk/                  # Core SDK (coming in Phase 2)
│   ├── vscode-extension/     # VS Code plugin (coming in Phase 4)
│   └── browser-extension/    # Browser extension (coming in Phase 4)
├── docs/                     # Documentation
└── scripts/                  # Build and deployment scripts
```

## 🧪 Testing

Run tests across all packages:
```bash
npm test
```

Run tests for a specific package:
```bash
cd packages/backend
npm test
```

## 🔧 Development

### Backend Development

The backend uses:
- **NestJS** for the API framework
- **Prisma** with **SQLite** for local database
- **JWT** for authentication
- **WebSocket** for real-time features

```bash
cd packages/backend
npm run dev    # Start in watch mode
npm test       # Run tests
npm run lint   # Lint code
```

### Frontend Development

The frontend uses:
- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** + **Shadcn/ui** for styling
- **Zustand** for state management

```bash
cd packages/web-app
npm run dev      # Start development server
npm test         # Run tests with Vitest
npm run lint     # Lint code
```

### Database Setup

The backend uses SQLite for local development:

1. **Generate Prisma client:**
   ```bash
   cd packages/backend
   npx prisma generate
   ```

2. **Create and migrate database:**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **View database (optional):**
   ```bash
   npx prisma studio
   ```

## 📝 Environment Variables

Copy the example environment file and update values:

```bash
cd packages/backend
cp .env.example .env
```

Key variables:
- `DATABASE_URL`: SQLite database path
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Backend server port (default: 3000)
- `CORS_ORIGIN`: Frontend URL (default: http://localhost:5173)

## 🏗️ Architecture

FlowScope follows a **local-first development** approach:

- **Local Development**: Uses SQLite, file-based storage, and local authentication
- **Staging/Production**: Seamlessly transitions to cloud services (PostgreSQL, AWS/Supabase)

### Key Design Patterns

1. **Service Abstraction**: All services use interfaces that can switch between local and cloud implementations
2. **Monorepo**: Lerna manages multiple packages with shared dependencies
3. **Type Safety**: Shared TypeScript types across all packages
4. **Testing First**: Comprehensive test coverage with Jest/Vitest

## 🔌 Framework Integration

FlowScope integrates with LLM frameworks through SDK adapters:

- **LangChain** (Python & TypeScript) - Coming in Phase 2
- **LlamaIndex** (Python) - Coming in Phase 2  
- **Flowise** - Planned for later phases
- **AutoGen** - Planned for later phases
- **CrewAI** - Planned for later phases

## 📦 Available Scripts

**Root level:**
- `npm run setup` - Install and bootstrap all packages
- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run clean` - Clean all build artifacts

## 🤝 Contributing

1. Follow conventional commits for commit messages
2. Write tests for all new functionality
3. Use TypeScript strict mode
4. Follow the existing code style (Prettier + ESLint)

## 📚 Documentation

- [Implementation Plan](./Implementation_Plan.md) - Detailed 12-week development plan
- [Deployment Transition Plan](./Deployment_Transition_Plan.md) - Local to production deployment guide
- [API Documentation] - Coming soon
- [SDK Documentation] - Coming soon

## 🐛 Issues & Support

For issues and feature requests, please use the GitHub issue tracker.

## 📄 License

[License information to be added]

---

**Phase 1 Complete** ✅
- [x] Project structure and monorepo setup
- [x] Backend foundation with NestJS + Prisma + SQLite
- [x] Frontend foundation with React + TypeScript + Vite
- [x] Shared types and utilities
- [x] Testing framework setup
- [x] Local development environment

**Next: Phase 2 - SDK & Framework Integrations** 🚀
