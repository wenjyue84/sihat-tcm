# Technology Stack & Build System

## Core Technologies

### Frontend Stack
- **Framework**: Next.js 16 with App Router
- **Runtime**: React 19.2.1 with Concurrent Features
- **Language**: TypeScript 5.x with strict mode
- **Styling**: Tailwind CSS v4 with CSS-in-JS
- **UI Components**: Radix UI for accessibility compliance
- **Animation**: Framer Motion for smooth interactions
- **State Management**: React Context API + Zustand for complex state

### Mobile Stack
- **Framework**: Expo SDK 52 with React Native
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Redux Toolkit + RTK Query
- **UI**: React Native Elements + custom components

### Backend & Database
- **Runtime**: Node.js with Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage with CDN
- **Caching**: Redis for session and performance caching

### AI & ML Integration
- **Primary Models**: Google Gemini (2.0-flash, 2.5-pro, 3-pro-preview)
- **SDK**: Vercel AI SDK for model integration
- **Routing**: Custom AI model router with fallback mechanisms
- **Vision**: Gemini Vision for medical image analysis

## Development Tools

### Code Quality
- **Linting**: ESLint with Next.js configuration
- **Type Checking**: TypeScript compiler with strict settings
- **Testing**: Vitest + React Testing Library + Jest-DOM
- **Property Testing**: Fast-check for property-based testing

### Build System
- **Bundler**: Next.js with Turbopack (development)
- **Package Manager**: npm (lockfile: package-lock.json)
- **Deployment**: Vercel with automatic deployments

## Common Commands

### Development
```bash
# Start web development server (port 3100)
npm run dev

# Start with HTTPS for testing
npm run dev-https

# Start mobile development
cd sihat-tcm-mobile && npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run property-based tests
npm run test:property

# Run with coverage
npm run test:coverage

# Generate property test reports
npm run test:pbt-report
```

### Build & Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Monitor deployment
npm run monitor:production
```

### Database Operations
```bash
# Run Supabase migrations
supabase db push

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts
```

## Architecture Patterns

### API Design
- RESTful endpoints with consistent error handling
- Rate limiting with Redis-based tracking
- JWT authentication on all protected routes
- Input validation using Zod schemas

### Component Architecture
- Server Components for data fetching
- Client Components for interactivity
- Custom hooks for business logic
- Context providers for global state

### Error Handling
- Centralized error boundaries
- Structured logging with Winston
- Performance monitoring with Sentry
- Health checks for all external services

### Security Practices
- Row Level Security (RLS) in database
- Input sanitization with DOMPurify
- CORS configuration for API endpoints
- Environment variable validation