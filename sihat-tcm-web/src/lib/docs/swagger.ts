import { createSwaggerSpec } from "next-swagger-doc";

/**
 * Swagger/OpenAPI Configuration for Sihat TCM API
 *
 * This configuration defines the OpenAPI specification for the Sihat TCM application.
 * It provides auto-generated API documentation accessible at /api-doc.
 *
 * @see https://swagger.io/specification/
 */
export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api", // Path to API routes
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Sihat TCM API Documentation",
        version: "1.0.0",
        description: `
# Sihat TCM API

AI-powered Traditional Chinese Medicine (TCM) diagnostic platform API.

## Features
- **Image Analysis**: Tongue and face complexion analysis using AI
- **Audio Analysis**: Voice and snore pattern analysis for TCM diagnostics
- **Health Monitoring**: System health checks and monitoring endpoints
- **AI Consultation**: Interactive chat-based TCM consultation
- **Meal Planning**: Personalized TCM dietary recommendations

## Authentication
Most endpoints require Supabase authentication. Include the Authorization header with a valid JWT token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting
API endpoints are subject to rate limiting to ensure fair usage and prevent abuse.

## Environment
- **Development**: http://localhost:3100
- **Production**: https://your-production-url.com
        `,
        contact: {
          name: "Sihat TCM Development Team",
          email: "support@sihat-tcm.com",
        },
        license: {
          name: "Proprietary",
        },
      },
      servers: [
        {
          url: "http://localhost:3100",
          description: "Development Server",
        },
        {
          url: "https://sihat-tcm.vercel.app",
          description: "Production Server",
        },
      ],
      tags: [
        {
          name: "Health",
          description: "System health monitoring endpoints",
        },
        {
          name: "Analysis",
          description: "AI-powered diagnostic analysis endpoints",
        },
        {
          name: "Chat",
          description: "Interactive consultation endpoints",
        },
        {
          name: "Admin",
          description: "Administrative endpoints (requires admin role)",
        },
        {
          name: "Monitoring",
          description: "Application monitoring and logging",
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Supabase JWT token from authentication",
          },
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              error: {
                type: "string",
                description: "Error message",
              },
              details: {
                type: "string",
                description: "Additional error details",
              },
            },
            required: ["error"],
          },
          HealthStatus: {
            type: "string",
            enum: ["healthy", "degraded", "unhealthy"],
            description: "Overall system health status",
          },
          CheckStatus: {
            type: "string",
            enum: ["ok", "slow", "down", "warning", "critical"],
            description: "Individual check status",
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
  });

  return spec;
};


