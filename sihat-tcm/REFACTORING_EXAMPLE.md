# Refactoring Example: Migrating API Routes

This document shows how to migrate existing API routes to use the new middleware utilities.

## Before: Original Route

```typescript
// src/app/api/chat/route.ts (BEFORE)
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate request body with Zod
        const validation = validateRequest(chatRequestSchema, body);
        if (!validation.success) {
            devLog('warn', 'API/chat', 'Validation failed', { error: validation.error });
            return validationErrorResponse(validation.error, validation.details);
        }

        const { messages, basicInfo, model, language: rawLanguage } = validation.data;
        // ... rest of handler logic ...

        return result.toTextStreamResponse({
            headers: {
                ...getCorsHeaders(req),
                'X-Model-Used': model
            }
        });
    } catch (error: any) {
        devLog('error', 'API/chat', 'Request error', { error });

        const { userFriendlyError, errorCode } = parseApiError(error);

        return new Response(JSON.stringify({
            error: userFriendlyError,
            code: errorCode,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }), {
            status: 500,
            headers: {
                ...getCorsHeaders(req),
                'Content-Type': 'application/json'
            }
        });
    }
}
```

## After: Using New Middleware

```typescript
// src/app/api/chat/route.ts (AFTER)
import { validateRequestBody, createErrorResponse } from '@/lib/api';
import { createStreamResponse } from '@/lib/api/handlers/stream-handler';
import { chatRequestSchema } from '@/lib/validations';
import { getSystemPrompt } from '@/lib/promptLoader';
import { prependLanguageInstruction, normalizeLanguage } from '@/lib/translations/languageInstructions';

const CONTEXT = 'API/chat';

export async function POST(req: Request) {
    // Validate request
    const validation = await validateRequestBody(req, chatRequestSchema, CONTEXT);
    if (!validation.success) {
        return validation.response;
    }

    const { messages, basicInfo, model, language: rawLanguage } = validation.data;
    const language = normalizeLanguage(rawLanguage);

    try {
        // Fetch system prompt
        let systemPrompt = await getSystemPrompt('doctor_chat');
        systemPrompt = prependLanguageInstruction(systemPrompt, 'basic', language);

        // Add patient information context
        if (basicInfo) {
            // ... patient info logic ...
        }

        // Filter messages
        const filteredMessages = messages?.filter((m: any) => m.role !== 'system') || [];

        // Create streaming response
        return await createStreamResponse(
            {
                model,
                systemPrompt,
                messages: filteredMessages,
                fallbackModels: ['gemini-1.5-flash'],
                context: CONTEXT,
            },
            req
        );
    } catch (error) {
        return createErrorResponse(error, CONTEXT);
    }
}
```

## Benefits

1. **Reduced Code**: ~40% less boilerplate
2. **Consistency**: All routes use same error handling
3. **Maintainability**: Change error format in one place
4. **Type Safety**: Better TypeScript inference
5. **Testability**: Easier to test middleware separately

## Migration Checklist

- [ ] Import new utilities
- [ ] Replace manual validation with `validateRequestBody`
- [ ] Replace manual error handling with `createErrorResponse`
- [ ] Replace streaming logic with `createStreamResponse` (if applicable)
- [ ] Test the route thoroughly
- [ ] Update any related tests

## Next Steps

1. Start with one simple route (e.g., `/api/health`)
2. Test thoroughly
3. Migrate similar routes in batches
4. Gradually migrate all routes

