# Use Next.js 16 App Router for Web Application

- **Status**: Accepted
- **Date**: 2025-12-01
- **Deciders**: Development Team
- **Tags**: architecture, frontend, framework

## Context

### Problem Statement

The Sihat TCM platform requires a modern web framework that can support:

- Server-side rendering (SSR) for better SEO and initial load performance
- API routes for backend functionality
- Type-safe development with TypeScript
- Easy deployment and scaling
- Good developer experience and community support

### Assumptions

- The team has React expertise
- We need to launch quickly while maintaining code quality
- The application will grow in complexity over time
- We need built-in API support for AI integrations

### Constraints

- Small development team (need good DX and productivity tools)
- Limited budget for infrastructure
- Need to support both desktop and mobile web
- Must integrate with Supabase for backend services

## Decision Drivers

- **Developer Experience**: Framework should boost productivity
- **Performance**: Fast initial load and good runtime performance
- **SEO**: Medical content needs to be discoverable
- **Type Safety**: Critical for medical application reliability
- **Ecosystem**: Rich ecosystem for AI/ML integrations

## Considered Options

### Option 1: Create React App (CRA)

**Description**: Traditional client-side React application with CRA

**Pros**:

- ✅ Simple setup
- ✅ Familiar to team
- ✅ Large community

**Cons**:

- ❌ Poor SEO out of the box
- ❌ No built-in API routes
- ❌ Slower initial load
- ❌ Deprecated by React team

### Option 2: Next.js 16 (App Router)

**Description**: Full-stack React framework with App Router architecture

**Pros**:

- ✅ Built-in SSR and SSG
- ✅ API routes included
- ✅ Excellent TypeScript support
- ✅ Edge runtime for AI streaming
- ✅ Automatic code splitting
- ✅ Vercel deployment optimized
- ✅ App Router with React Server Components

**Cons**:

- ⚠️ Learning curve for App Router
- ⚠️ Some third-party libraries need adaptation

### Option 3: Remix

**Description**: Modern React framework focused on web standards

**Pros**:

- ✅ Great data loading patterns
- ✅ Built-in error handling
- ✅ Progressive enhancement

**Cons**:

- ❌ Smaller ecosystem
- ❌ Less AI/streaming support
- ❌ Team has less experience

## Decision

We will **use Next.js 16 with the App Router** for the Sihat TCM web application.

### Chosen Option

**Next.js 16 (App Router)** because it provides the best balance of performance, developer experience, and feature set for our medical AI application. The Edge Runtime and streaming capabilities are crucial for our AI chat features.

### Implementation Details

- Use App Router architecture (not Pages Router)
- Leverage Server Components for data fetching
- Use Client Components only when necessary (interactivity, hooks)
- API routes in `src/app/api/*` with Edge Runtime where possible
- Path alias: `@/*` maps to `./src/*`
- Strict TypeScript mode enabled
- Tailwind CSS v4 for styling

## Consequences

### Positive Consequences

- ✅ **Better Performance**: SSR and automatic code splitting improve load times
- ✅ **SEO Friendly**: Medical content is indexable and discovers
- ✅ **Unified Codebase**: Frontend and API routes in same project
- ✅ **Type Safety**: End-to-end TypeScript with strict mode
- ✅ **AI Streaming**: Native support for streaming AI responses with `@ai-sdk/react`
- ✅ **Easy Deployment**: One-click deploy to Vercel
- ✅ **Great DX**: Fast refresh, built-in optimizations, clear file structure

### Negative Consequences

- ⚠️ **Learning Curve**: Team needs to learn App Router patterns and Server Components
- ⚠️ **Bundle Size**: Framework adds some overhead vs plain React
- ⚠️ **Vendor Lock-in**: Somewhat tied to Vercel ecosystem (though can deploy elsewhere)

### Risks & Mitigation

| Risk                                        | Severity | Mitigation Strategy                                                                    |
| ------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| App Router adoption issues                  | Medium   | Comprehensive documentation in DEVELOPER_MANUAL.md, code reviews, and pair programming |
| Performance regression                      | Low      | Lighthouse CI in GitHub Actions, performance budgets                                   |
| Breaking changes in future Next.js versions | Medium   | Pin version, thorough testing before upgrades, follow Next.js upgrade guides           |

## Compliance & Validation

### Testing Strategy

- [x] Unit tests with Vitest
- [x] Integration tests for API routes
- [ ] E2E tests with Playwright (planned)
- [x] Property-based testing for critical functions

### Monitoring

- Vercel Analytics for Web Vitals
- Error tracking with console logging
- Build time monitoring in CI/CD
- Bundle size analysis

### Success Criteria

- ✅ Initial page load < 2s
- ✅ Build completes in < 3 minutes
- ✅ Type checking passes with strict mode
- ✅ Lighthouse score > 90

## Related Decisions

- [ADR-0002: Use Supabase for Backend](./0002-supabase-backend.md)
- [ADR-0003: Use AI SDK for AI Integrations](./0003-ai-sdk-integration.md)
- [ADR-0004: Use Tailwind CSS v4](./0004-tailwind-v4.md)

## References

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

## Notes

The App Router represents a significant paradigm shift from the Pages Router. We're investing in training and documentation to ensure the team can work effectively with Server Components and the new data fetching patterns.

We chose Next.js 16 specifically (not 15 or earlier) for the improved streaming capabilities and Edge Runtime enhancements, which are critical for our real-time AI diagnosis features.

---

**Revision History**:

- 2025-12-01: Initial draft by Development Team
- 2025-12-01: Status changed to Accepted by Tech Lead
- 2025-12-26: Updated with actual implementation details
