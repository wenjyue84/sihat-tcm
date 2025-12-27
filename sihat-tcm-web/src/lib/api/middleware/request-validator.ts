/**
 * Request Validation Middleware
 *
 * Provides consistent request validation across API routes.
 */

import { z } from "zod";
import { devLog } from "@/lib/systemLogger";
import { validateRequest, validationErrorResponse } from "@/lib/validations";
import { getCorsHeaders } from "@/lib/cors";

/**
 * Validates request body against a schema
 * Returns validated data or error response
 */
export async function validateRequestBody<T>(
  req: Request,
  schema: z.ZodSchema<T>,
  context: string
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const body = await req.json();

    const validation = validateRequest(schema, body);

    if (!validation.success) {
      devLog("warn", context, "Validation failed", { error: validation.error });
      return {
        success: false,
        response: validationErrorResponse(validation.error, validation.details),
      };
    }

    return {
      success: true,
      data: validation.data,
    };
  } catch (error) {
    devLog("error", context, "Failed to parse request body", { error });
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: "Invalid request body",
          code: "INVALID_REQUEST",
        }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        }
      ),
    };
  }
}

/**
 * Wraps an API handler with request validation
 */
export function withValidation<TBody, TArgs extends unknown[]>(
  schema: z.ZodSchema<TBody>,
  handler: (body: TBody, ...args: TArgs) => Promise<Response>,
  context: string
) {
  return async (req: Request, ...args: TArgs): Promise<Response> => {
    const validation = await validateRequestBody(req, schema, context);

    if (!validation.success) {
      return validation.response;
    }

    return handler(validation.data, ...args);
  };
}
